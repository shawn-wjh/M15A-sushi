/**
 * Middleware to validate each invoice in an XML upload.
 * Assumes that invoice data is available as either:
 *   - req.xmlData (if a prior middleware has already parsed the XML)
 *   - or req.body.xmlDataset (raw XML string)
 *
 * Each invoice must have a valid IssueDate and DueDate, and it must include
 * monetary total details under the LegalMonetaryTotal property (either PayableAmount or TaxInclusiveAmount).
 */
function validateXmlInvoices(req, res, next) {
  try {
    // Get the XML data from either source
    const xmlData = req.xmlData || req.body.xmlDataset;
    if (!xmlData) {
      return res.status(400).json({
        status: 'error',
        message: 'No invoice data provided.'
      });
    }

    // If the data is a raw XML string, parse it
    let parsedData;
    if (typeof xmlData === 'string') {
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        attrNameProcessors: [xml2js.processors.stripPrefix]
      });
      parsedData = parser.parseStringPromise(xmlData);
    } else {
      parsedData = Promise.resolve(xmlData);
    }

    // Process the parsed data
    parsedData.then(data => {
      // Handle both single invoice and invoice dataset cases
      let invoices;
      if (data.Invoices && data.Invoices.Invoice) {
        // Dataset case: multiple invoices wrapped in <Invoices>
        invoices = Array.isArray(data.Invoices.Invoice) ? data.Invoices.Invoice : [data.Invoices.Invoice];
      } else if (data.Invoice) {
        // Single invoice case
        invoices = [data.Invoice];
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid XML structure. Expected <Invoice> or <Invoices> element.'
        });
      }

      const errors = [];
      invoices.forEach((invoice, index) => {
        // Check for IssueDate
        if (!invoice.IssueDate) {
          errors.push(`Invoice at index ${index} is missing IssueDate.`);
        } else if (isNaN(Date.parse(invoice.IssueDate))) {
          errors.push(`Invoice at index ${index} has an invalid IssueDate.`);
        }

        // Check for DueDate
        if (!invoice.DueDate) {
          errors.push(`Invoice at index ${index} is missing DueDate.`);
        } else if (isNaN(Date.parse(invoice.DueDate))) {
          errors.push(`Invoice at index ${index} has an invalid DueDate.`);
        }

        // Check that LegalMonetaryTotal exists and has at least one of PayableAmount or TaxInclusiveAmount
        if (!invoice.LegalMonetaryTotal) {
          errors.push(`Invoice at index ${index} is missing total amount information.`);
        } else {
          // Validate PayableAmount if present
          if (invoice.LegalMonetaryTotal.PayableAmount) {
            const amount = parseFloat(invoice.LegalMonetaryTotal.PayableAmount);
            if (isNaN(amount)) {
              errors.push(`Invoice at index ${index} has an invalid monetary amount.`);
            }
          }
          // Validate TaxInclusiveAmount if present
          if (invoice.LegalMonetaryTotal.TaxInclusiveAmount) {
            const amount = parseFloat(invoice.LegalMonetaryTotal.TaxInclusiveAmount);
            if (isNaN(amount)) {
              errors.push(`Invoice at index ${index} has an invalid monetary amount.`);
            }
          }
          // Check that at least one amount is present
          if (!invoice.LegalMonetaryTotal.PayableAmount && !invoice.LegalMonetaryTotal.TaxInclusiveAmount) {
            errors.push(`Invoice at index ${index} is missing total amount information.`);
          }
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid invoice data.',
          errors
        });
      }

      // Attach the validated invoices to the request for downstream use
      req.validatedInvoices = invoices;
      next();
    }).catch(error => {
      console.error('Error parsing XML:', error);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to parse XML data.',
        details: error.message
      });
    });
  } catch (error) {
    console.error('Error in validateXmlInvoices:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Failed to validate XML data.',
      details: error.message
    });
  }
}

module.exports = validateXmlInvoices;
  