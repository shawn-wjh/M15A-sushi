/**
 * Invoice validation middleware
 * Validates the JSON input for invoice generation
 */

const xmljs = require('xml-js');
const currencyCodes = require('currency-codes');
const countries = require('i18n-iso-countries');

const validateInvoiceInput = (req, res, next) => {
  try {
    const data = req.body;

    // Check required fields present
    const requiredFields = ['invoiceId', 'issueDate', 'buyer', 'supplier', 'total', 'items'];
    const missingFields = requiredFields.filter((field) => !(field in data) || data[field] === undefined);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // List of all fields and their expected types
    const typeChecks = {
      invoiceId: 'string',
      total: 'number',
      buyer: 'string',
      supplier: 'string',
      issueDate: 'string',
      dueDate: 'string',
      currency: 'string',
      buyerPhone: 'string'
    };

    Object.entries(typeChecks).forEach(([field, expectedType]) => {
      // Only check type if the field exists in the data
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        throw new Error(`${field} must be a ${expectedType}`);
      }
    });

    // Check items array
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }

    // Check each item has required fields
    data.items.forEach((item, index) => {
      const requiredItemFields = ['name', 'count', 'cost'];
      const missingItemFields = requiredItemFields.filter((field) => !(field in item));
      if (missingItemFields.length > 0) {
        throw new Error(`Item ${index} missing fields: ${missingItemFields.join(', ')}`);
      }
    });

    // Check if issue date and due date are in proper date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // Validate required issueDate
    if (!dateRegex.test(data.issueDate)) {
      throw new Error('Issue date must be in YYYY-MM-DD format');
    }
    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      throw new Error('Issue date is not a valid date');
    }

    // Validate optional dueDate if present
    if (data.dueDate !== undefined) {
      if (!dateRegex.test(data.dueDate)) {
        throw new Error('Due date must be in YYYY-MM-DD format');
      }
      const dueDate = new Date(data.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error('Due date is not a valid date');
      }
      // Only check date order if dueDate is provided
      if (issueDate >= dueDate) {
        throw new Error('Issue date must be before due date');
      }
    }

    // Check item count and cost
    let sum = 0;
    
    for (const item of data.items) {
      if (item.count <= 0) {
        throw new Error('Item count must be greater than 0');
      }
      if (item.cost <= 0) {
        throw new Error('Item cost must be greater than 0');
      }
      const itemTotal = item.count * item.cost;
      sum += itemTotal;
      console.log(`- ${item.name}: ${item.count} x ${item.cost} = ${itemTotal}`);
    }
    
    // Check invoice total against item costs
    if (data.total !== sum) {
      throw new Error('Invoice total does not match item costs');
    }

    // Check valid currency code if provided
    if (data.currency !== undefined && !checkCurrencyCode(data.currency)) {
      throw new Error('Invalid currency code');
    }

    // Check valid country code if buyer address and country are provided
    if (data.buyerAddress?.country !== undefined && !checkCountryCode(data.buyerAddress.country)) {
      throw new Error('Invalid country code');
    }

    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      error: error.message
    });
  }
};

const checkCurrencyCode = (currencyCode) => {
  return typeof currencyCode === "string" && /^[A-Z]{3}$/.test(currencyCode.toUpperCase());
};

const checkCountryCode = (countryCode) => {
  return typeof countryCode === "string" && /^[A-Z]{3}$/.test(countryCode.toUpperCase());
};

/**
 * Validate invoice standard
 * Validates the invoice standard against UBL 2.4, peppol, etc.
 */
const validateInvoiceStandard = (req, res, next) => {
  try {
    // Get the UBL XML from the request body
    const ublXml = req.body.xml || req.body.invoice;
    
    if (!ublXml) {
      throw new Error('No UBL XML provided for validation');
    }

    // Parse the XML to a JavaScript object
    const options = { compact: true, ignoreComment: true, alwaysChildren: true };
    const parsedXml = xmljs.xml2js(ublXml, options);
    
    // Initialize validation result
    const validationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if root Invoice element exists
    const invoice = parsedXml.Invoice;
    if (!invoice) {
      validationResult.valid = false;
      validationResult.errors.push('Missing Invoice root element');
      return res.status(400).json({
        status: 'error',
        message: 'Invoice does not comply with Peppol standards',
        validationErrors: validationResult.errors
      });
    }

    // ===== Peppol Validation Rules =====

    // 1. Check UBL namespaces (Peppol requires specific namespaces)
    const attributes = invoice._attributes || {};
    if (!attributes.xmlns || !attributes.xmlns.includes('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2')) {
      validationResult.valid = false;
      validationResult.errors.push('Missing or invalid UBL namespace (Peppol rule BR-01)');
    }

    // 2. Check for required elements
    const requiredElements = [
      'cbc:ID',
      'cbc:IssueDate',
      'cbc:InvoiceTypeCode',
      'cac:AccountingSupplierParty',
      'cac:AccountingCustomerParty',
      'cac:LegalMonetaryTotal',
      'cac:InvoiceLine'
    ];

    requiredElements.forEach(element => {
      const path = element.split(':');
      if (path.length !== 2) return;
      
      if (!invoice[element]) {
        validationResult.valid = false;
        validationResult.errors.push(`Missing required element: ${element} (Peppol rule BR-${requiredElements.indexOf(element) + 10})`);
      }
    });

    // 3. Check invoice type code (Peppol requires specific codes)
    const invoiceTypeCode = invoice['cbc:InvoiceTypeCode'];
    if (invoiceTypeCode && invoiceTypeCode._text !== '380') {
      validationResult.warnings.push(`Invoice type code '${invoiceTypeCode._text}' is not the standard commercial invoice code '380' (Peppol rule BR-DE-08)`);
    }

    // 4. Check supplier and customer party information
    const supplierParty = invoice['cac:AccountingSupplierParty']?.['cac:Party'];
    const customerParty = invoice['cac:AccountingCustomerParty']?.['cac:Party'];
    
    // Check if supplier name exists
    if (!supplierParty?.['cac:PartyName']?.['cbc:Name']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing supplier name (Peppol rule BR-S-02)');
    }
    
    // Check if customer name exists
    if (!customerParty?.['cac:PartyName']?.['cbc:Name']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing customer name (Peppol rule BR-B-02)');
    }

    // 5. Check postal addresses
    const supplierAddress = supplierParty?.['cac:PostalAddress'];
    const customerAddress = customerParty?.['cac:PostalAddress'];
    
    if (!supplierAddress?.['cbc:StreetName']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing supplier street address (Peppol rule BR-S-05)');
    }

    // Check if supplier country code exists
    if (!supplierAddress?.['cac:Country']?.['cbc:IdentificationCode']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing supplier country code (Peppol rule BR-S-07)');
    }
    
    // Check if customer street address exists
    if (!customerAddress?.['cbc:StreetName']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing customer street address (Peppol rule BR-B-05)');
    }
    
    // Check if customer country code exists
    if (!customerAddress?.['cac:Country']?.['cbc:IdentificationCode']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing customer country code (Peppol rule BR-B-07)');
    }

    // 6. Check currency code using currency-codes package
    const currencyCode = invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?._attributes?.currencyID;
    if (!currencyCodes.code(currencyCode)) {
      validationResult.valid = false;
      validationResult.errors.push(`Invalid currency code: ${currencyCode} (Peppol rule BR-40)`);
    }

    // 7. Check country code using i18n-iso-countries package
    const supplierCountryCode = invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PostalAddress']?.['cac:Country']?.['cbc:IdentificationCode']?._text;
    const customerCountryCode = invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PostalAddress']?.['cac:Country']?.['cbc:IdentificationCode']?._text;

    if (!countries.isValid(supplierCountryCode)) {
      validationResult.valid = false;
      validationResult.errors.push(`Invalid supplier country code: ${supplierCountryCode} (Peppol rule BR-50)`);
    }

    if (!countries.isValid(customerCountryCode)) {
      validationResult.valid = false;
      validationResult.errors.push(`Invalid customer country code: ${customerCountryCode} (Peppol rule BR-60)`);
    }

    // 8. Check invoice lines
    const invoiceLines = invoice['cac:InvoiceLine'];
    if (!invoiceLines) {
      validationResult.valid = false;
      validationResult.errors.push('Missing invoice lines (Peppol rule BR-16)');
    } else {
      const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
      
      if (lines.length === 0) {
        validationResult.valid = false;
        validationResult.errors.push('Invoice must contain at least one line (Peppol rule BR-16)');
      } else {
        lines.forEach((line, index) => {
          // Check line item ID
          if (!line['cbc:ID']?._text) {
            validationResult.valid = false;
            validationResult.errors.push(`Line ${index + 1}: Missing line ID (Peppol rule BR-21)`);
          }
          
          // Check item name
          if (!line['cac:Item']?.['cbc:Name']?._text) {
            validationResult.valid = false;
            validationResult.errors.push(`Line ${index + 1}: Missing item name (Peppol rule BR-25)`);
          }
          
          // Check price
          const price = line['cac:Price'];
          if (!price) {
            validationResult.valid = false;
            validationResult.errors.push(`Line ${index + 1}: Missing price information (Peppol rule BR-26)`);
          } else {
            if (!price['cbc:PriceAmount']?._text) {
              validationResult.valid = false;
              validationResult.errors.push(`Line ${index + 1}: Missing price amount (Peppol rule BR-27)`);
            }
            
            // Check currency consistency
            const lineCurrency = price['cbc:PriceAmount']?._attributes?.currencyID;
            const documentCurrency = invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?._attributes?.currencyID;
            
            if (lineCurrency && documentCurrency && lineCurrency !== documentCurrency) {
              validationResult.warnings.push(`Line ${index + 1}: Currency (${lineCurrency}) does not match document currency (${documentCurrency}) (Peppol rule BR-30)`);
            }
            
            // Check quantity
            if (!price['cbc:BaseQuantity']?._text) {
              validationResult.valid = false;
              validationResult.errors.push(`Line ${index + 1}: Missing quantity (Peppol rule BR-31)`);
            }
          }
        });
      }
    }

    // 9. Check monetary total
    const monetaryTotal = invoice['cac:LegalMonetaryTotal'];
    if (!monetaryTotal?.['cbc:PayableAmount']?._text) {
      validationResult.valid = false;
      validationResult.errors.push('Missing payable amount (Peppol rule BR-52)');
    }

    // Return validation result
    if (!validationResult.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invoice does not comply with Peppol standards',
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings
      });
    }

    // If validation passes
    if (next) {
      // Attach validation result to request for potential later use
      req.validationResult = validationResult;
      next();
    } else {
      return res.status(200).json({
        status: 'success',
        message: 'Invoice successfully validated against Peppol standards',
        validationWarnings: validationResult.warnings.length > 0 ? validationResult.warnings : []
      });
    }
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Error validating invoice against Peppol standards',
      error: error.message
    });
  }
};

module.exports = {
  validateInvoiceInput,
  validateInvoiceStandard
};
