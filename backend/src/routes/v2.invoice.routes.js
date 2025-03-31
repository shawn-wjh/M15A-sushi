const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

const {
  createInvoice,
  getInvoice,
  updateValidationStatus,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoice.controller');

const { validateInvoiceStandardv2, validateInvoiceInput } = require('../middleware/invoice-validation');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

router.post('/create', createInvoice);

router.post('/:invoiceid/validate', 
  getInvoice,
  validateInvoiceStandardv2,
  updateValidationStatus,
  (req, res) => {
    if (req.status === 'success') {
      return res.status(200).json({
        status: 'success',
        message: req.message,
        validationResult: req.validationResult,
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: req.message,
        validationResult: req.validationResult,
      });
    }
  }
);

/**
 * Create and validate invoice with user-selected validation standards
 * @route POST /v2/invoices/create-and-validate
 * @param {object} req.body - Invoice details and selected validation schemas
 * @returns {object} 200 - Combined invoice and validation report
 */
router.post('/create-and-validate',
  validateInvoiceInput,
  async (req, res, next) => {
    try {
      // Store the original json method
      const originalJson = res.json;

      // Override the json method to capture the invoice data
      res.json = function (data) {
        // Store the invoice data in the request
        req.invoiceData = data;

        // Restore the original json method
        res.json = originalJson;

        // Continue to validation
        next();

        // Return res to allow chaining
        return res;
      };

      // Call the createInvoice controller
      await createInvoice(req, res, next);
    } catch (error) {
      next(error);
    }
  },
  // This middleware will prepare for validation
  (req, res, next) => {
    // Get the UBL XML from the invoice data
    if (req.invoiceData && req.invoiceData.invoice) {
      req.body.xml = req.invoiceData.invoice;
      
      // If no schemas specified, default to peppol
      if (!req.body.schemas) {
        req.body.schemas = ['peppol'];
      }
    }
    next();
  },
  validateInvoiceStandardv2,
  // Final handler to combine invoice and validation results
  (req, res) => {
    // If validation failed
    if (!req.validationResult.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invoice validation failed',
        error: req.validationResult.errors,
        validationWarnings: req.validationResult.warnings,
        appliedStandards: req.body.schemas,
        invoiceId: req.invoiceData?.invoiceId
      });
    }

    // If we have both invoice data and validation results
    if (req.invoiceData && req.validationResult) {
      return res.status(200).json({
        ...req.invoiceData,
        validation: {
          status: 'success',
          message: 'Invoice successfully validated',
          appliedStandards: req.body.schemas,
          warnings: req.validationResult.warnings.length > 0 
            ? req.validationResult.warnings 
            : []
        }
      });
    }

    // If something went wrong
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create and validate invoice'
    });
  }
);

router.post('/:invoiceid/update', 
  // to add user validation
  updateInvoice
);

router.delete('/:invoiceid', 
  // to add user validation
  deleteInvoice
);

module.exports = router;

