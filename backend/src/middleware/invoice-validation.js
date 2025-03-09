/**
 * Invoice validation middleware
 * Validates the JSON input for invoice generation
 */

const validateInvoiceInput = (req, res, next) => {
  try {
    const {
      issueDate,
      dueDate,
      supplierName,
      buyerName,
      payableAmount,
      currency,
      // Optional fields
      description,
      items,
      taxAmount,
      notes
    } = req.body;

    // Required fields validation
    const requiredFields = {
      issueDate,
      dueDate,
      supplierName,
      buyerName,
      payableAmount,
      currency
    };

    // Check if required fields are present
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        details: missingFields
      });
    }

    // Date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(issueDate) || !dateRegex.test(dueDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Currency code validation (3 letters)
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(currency)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid currency code. Use ISO 4217 format (e.g., AUD, USD)'
      });
    }

    // Amount validation
    if (typeof payableAmount !== 'number' || payableAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payable amount'
      });
    }

    // Name length validation
    if (supplierName.length < 2 || buyerName.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier and buyer names must be at least 2 characters long'
      });
    }

    // Optional items validation
    if (items && Array.isArray(items)) {
      const invalidItems = items.filter((item) => !item.description
                || !item.quantity
                || !item.unitPrice
                || typeof item.quantity !== 'number'
                || typeof item.unitPrice !== 'number');

      if (invalidItems.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid items format',
          details: 'Each item must have description, quantity, and unitPrice'
        });
      }
    }

    // If all validations pass, attach validated data to request
    req.validatedInvoice = {
      issueDate,
      dueDate,
      supplierName,
      buyerName,
      payableAmount,
      currency,
      description,
      items,
      taxAmount,
      notes
    };

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error validating invoice data',
      details: error.message
    });
  }
};

module.exports = {
  validateInvoiceInput
};
