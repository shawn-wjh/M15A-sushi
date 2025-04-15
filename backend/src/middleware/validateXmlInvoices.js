/**
 * Middleware to validate each invoice in an XML upload.
 * Assumes that invoice data is available as either:
 *   - req.xmlData (if a prior middleware has already parsed the XML)
 *   - or req.body.xmlDataset (raw XML string)
 *
 * Each invoice must have a valid IssueDate and DueDate, and it must include
 * monetary total details under the LegalMonetaryTotal property.
 * 
 * Follows PEPPOL BIS Billing 3.0 validation rules and Fair Work Commission requirements.
 */
function validateXmlInvoices(req, res, next) {
  try {
    // Get the XML data from either source
    const xmlData = req.xmlData || req.body.xmlDataset;
    if (!xmlData) {
      return res.status(400).json({
        status: 'error',
        message: 'No invoice data provided.',
        errors: ['No invoice data provided.']
      });
    }

    // Parse the XML data using the same approach as in invoice.controller.js
    const parseXML = async (xmlString) => {
      try {
        // First, check if we have valid XML
        if (!xmlString || typeof xmlString !== 'string') {
          console.log('Invalid XML input');
          return null;
        }

        const xml2js = require('xml2js');
        const parser = new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: false,
          tagNameProcessors: [xml2js.processors.stripPrefix],
          attrNameProcessors: [xml2js.processors.stripPrefix]
        });
        
        const result = await parser.parseStringPromise(xmlString);
        console.log('Parsed XML structure:', Object.keys(result));
        
        // Return the full parsed result
        return result;
      } catch (error) {
        console.error('Error parsing XML:', error);
        return null;
      }
    };

    // Helper to safely get nested value
    const getValue = (obj, path) => {
      if (!obj) return null;
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (!current || !current[part]) return null;
        current = current[part];
      }
      // Handle both string values and object with _ property
      return typeof current === 'object' && current._ ? current._ : current;
    };

    // Fair Work Commission validation adapted for our XML structure
    const validateFairWorkCommission = (invoice, errors) => {
      // Check PaymentMeans -> PayeeFinancialAccount details
      if (!invoice.PaymentMeans || !invoice.PaymentMeans.PayeeFinancialAccount) {
        errors.push('Missing PaymentMeans or PayeeFinancialAccount details (Fair Work Commission requirement)');
        return errors;
      }
      
      const account = invoice.PaymentMeans.PayeeFinancialAccount;
      
      // Check for account ID
      const accountID = getValue(account, 'ID');
      if (!accountID) {
        errors.push('Missing PayeeFinancialAccount ID (Fair Work Commission requirement)');
      }
      
      // Check for account name
      const accountName = getValue(account, 'Name');
      if (!accountName) {
        errors.push('Missing PayeeFinancialAccount Name (Fair Work Commission requirement)');
      }
      
      // Check for FinancialInstitutionBranch details
      if (!account.FinancialInstitutionBranch) {
        errors.push('Missing FinancialInstitutionBranch details (Fair Work Commission requirement)');
        return errors;
      }
      
      // Check for branch ID (BSB)
      const branchID = getValue(account.FinancialInstitutionBranch, 'ID');
      if (!branchID) {
        errors.push('Missing FinancialInstitutionBranch ID/BSB (Fair Work Commission requirement)');
      }
      
      console.log('Fair Work Commission validation completed with payment details:', {
        accountID,
        accountName,
        branchID
      });
      
      return errors;
    };

    // Process the parsed data
    parseXML(xmlData).then(data => {
      if (!data) {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to parse XML data.',
          errors: ['Failed to parse XML data.']
        });
      }
      
      console.log('Parsing XML data complete');
      
      // Extract invoice from parsed data
      let invoice;
      if (data.Invoice) {
        console.log('Found single Invoice');
        invoice = data.Invoice;
      } else {
        console.log('XML structure:', JSON.stringify(data).substring(0, 300) + '...');
        return res.status(400).json({
          status: 'error',
          message: 'Invalid XML structure. Expected <Invoice> element.',
          errors: ['Invalid XML structure. Expected <Invoice> element.'],
          availableKeys: Object.keys(data)
        });
      }
      
      console.log('Invoice keys:', Object.keys(invoice));
      
      // Validate the invoice
      const errors = [];
      
      // === Basic Required Fields ===
      
      // Check for required PEPPOL identifiers
      if (!invoice.CustomizationID) {
        errors.push('Invoice is missing CustomizationID (PEPPOL identifier).');
      } else {
        const customizationID = getValue(invoice, 'CustomizationID');
        // PEPPOL BIS Billing 3.0 format check (should contain peppol identifier)
        if (!customizationID.includes('peppol')) {
          errors.push(`CustomizationID should reference PEPPOL: ${customizationID}`);
        }
      }
      
      if (!invoice.ProfileID) {
        errors.push('Invoice is missing ProfileID (PEPPOL billing profile).');
      }
      
      if (!invoice.ID) {
        errors.push('Invoice is missing ID (invoice number).');
      }
      
      if (!invoice.InvoiceTypeCode) {
        errors.push('Invoice is missing InvoiceTypeCode.');
      }
      
      if (!invoice.DocumentCurrencyCode) {
        errors.push('Invoice is missing DocumentCurrencyCode.');
      } else {
        const currency = getValue(invoice, 'DocumentCurrencyCode');
        // Simple currency code format validation (3 uppercase letters)
        if (!/^[A-Z]{3}$/.test(currency)) {
          errors.push(`Invalid currency code format: ${currency}`);
        }
      }
      
      // === Date validations ===
      
      // Check for IssueDate
      if (!invoice.IssueDate) {
        errors.push('Invoice is missing IssueDate.');
      } else {
        const issueDate = getValue(invoice, 'IssueDate');
        if (isNaN(Date.parse(issueDate))) {
          errors.push(`Invoice has an invalid IssueDate format: ${issueDate}`);
        }
      }

      // Check for DueDate
      if (!invoice.DueDate) {
        errors.push('Invoice is missing DueDate.');
      } else {
        const dueDate = getValue(invoice, 'DueDate');
        if (isNaN(Date.parse(dueDate))) {
          errors.push(`Invoice has an invalid DueDate format: ${dueDate}`);
        }
        
        // Check if issue date is before due date
        const issueDate = getValue(invoice, 'IssueDate');
        if (issueDate && dueDate && !isNaN(Date.parse(issueDate)) && !isNaN(Date.parse(dueDate))) {
          if (new Date(issueDate) > new Date(dueDate)) {
            errors.push('IssueDate must be before or equal to DueDate.');
          }
        }
      }
      
      // === Party information ===
      
      // Check for AccountingSupplierParty
      if (!invoice.AccountingSupplierParty || !invoice.AccountingSupplierParty.Party) {
        errors.push('Invoice is missing AccountingSupplierParty information.');
      } else {
        const supplierParty = invoice.AccountingSupplierParty.Party;
        if (!supplierParty.PartyName || !getValue(supplierParty, 'PartyName.Name')) {
          errors.push('Supplier is missing PartyName.');
        }
      }
      
      // Check for AccountingCustomerParty
      if (!invoice.AccountingCustomerParty || !invoice.AccountingCustomerParty.Party) {
        errors.push('Invoice is missing AccountingCustomerParty information.');
      } else {
        const customerParty = invoice.AccountingCustomerParty.Party;
        if (!customerParty.PartyName || !getValue(customerParty, 'PartyName.Name')) {
          errors.push('Customer is missing PartyName.');
        }
      }
      
      // === Monetary amounts ===
      
      // Check for LegalMonetaryTotal and PayableAmount
      if (!invoice.LegalMonetaryTotal) {
        errors.push('Invoice is missing LegalMonetaryTotal element.');
      } else {
        const payableAmount = invoice.LegalMonetaryTotal.PayableAmount;
        if (!payableAmount) {
          errors.push('Invoice is missing PayableAmount in LegalMonetaryTotal.');
        } else {
          // Handle complex PayableAmount object
          let amountValue;
          if (typeof payableAmount === 'object' && payableAmount._) {
            amountValue = payableAmount._;
            console.log('PayableAmount object:', payableAmount);
          } else {
            amountValue = payableAmount;
          }
          
          const amount = parseFloat(amountValue);
          console.log('PayableAmount:', amount);
          
          if (isNaN(amount)) {
            errors.push(`Invoice has an invalid PayableAmount: ${amountValue}`);
          } else if (amount <= 0) {
            errors.push(`PayableAmount must be greater than zero: ${amount}`);
          }
        }
      }
      
      // Check for at least one InvoiceLine
      if (!invoice.InvoiceLine) {
        errors.push('Invoice must have at least one InvoiceLine.');
      } else {
        // Convert to array if single item
        const invoiceLines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine];
        if (invoiceLines.length === 0) {
          errors.push('Invoice must have at least one InvoiceLine.');
        }
        
        // Validate each invoice line
        invoiceLines.forEach((line, index) => {
          if (!line.ID) {
            errors.push(`InvoiceLine ${index + 1} is missing ID.`);
          }
          
          if (!line.Item || !getValue(line, 'Item.Name')) {
            errors.push(`InvoiceLine ${index + 1} is missing Item or Item Name.`);
          }
          
          if (!line.Price || !line.Price.PriceAmount) {
            errors.push(`InvoiceLine ${index + 1} is missing Price information.`);
          } else {
            const priceAmount = getValue(line, 'Price.PriceAmount');
            if (priceAmount && isNaN(parseFloat(priceAmount))) {
              errors.push(`InvoiceLine ${index + 1} has an invalid PriceAmount: ${priceAmount}`);
            }
          }
        });
      }
      
      // === Fair Work Commission validations ===
      validateFairWorkCommission(invoice, errors);
      
      if (errors.length > 0) {
        console.log('Validation errors:', errors);
        return res.status(400).json({
          status: 'error',
          message: `Invalid invoice data. Errors: ${errors.join(' | ')}`,
          errors
        });
      }

      // Attach the validated invoice to the request for downstream use
      req.validatedInvoices = [invoice];
      next();
    }).catch(error => {
      console.error('Error processing XML:', error);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to process XML data: ' + error.message,
        errors: [error.message],
        details: error.message
      });
    });
  } catch (error) {
    console.error('Error in validateXmlInvoices:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Failed to validate XML data: ' + error.message,
      errors: [error.message],
      details: error.message
    });
  }
}

module.exports = validateXmlInvoices;
  