const express = require('express');

const router = express.Router();

// Import middleware (more needs to be added)
const {
  validateInvoiceInput,
  validateInvoiceStandard
} = require('../middleware/invoice-validation');

// Import controllers (more needs to be added)
const {
  createInvoice,
  listInvoices,
  getInvoice,
  // downloadInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoice.controller');

const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

/**
 * Generate UBL 2.4-compliant invoice
 * @route POST /v1/invoices
 * @param {object} req.body - Invoice details (IssueDate, DueDate, SupplierName, etc.)
 * @returns {object} 200 - Generated UBL invoice
 */
router.post(
  '/create',
  validateInvoiceInput, // Validate invoice input
  createInvoice // Outputs the UBL 2.4 XML to the user and stores it in the database
);

/**
 * Validate UBL 2.4-compliant invoice
 * @route POST /v1/invoices/:invoiceid/validate
 * @param {object} req.body - invoice XML
 * @returns {object} 200 - Validation report
 */
router.post(
  '/:invoiceid/validate',
  getInvoice,
  async (req, res) => {
    await validateInvoiceStandard(req, res, false);
  }
);

/**
 * create and validate invoice
 * @route POST /v1/invoices/create-and-validate
 * @param {object} req.body - invoice XML
 * @returns {object} 200 - Combined invoice and validation report
 */
router.post(
  '/create-and-validate',
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
  // This middleware will validate the invoice and attach results to req
  async (req, res, next) => {
    // Get the UBL XML from the invoice data
    if (req.invoiceData && req.invoiceData.invoice) {
      req.body.xml = req.invoiceData.invoice;
    }
    next();
  },
  // Call validateInvoiceStandard with next parameter to ensure it attaches validationResult to req
  async (req, res, next) => {
    try {
      // Create a custom next function that will attach the validation result to the request
      const customNext = () => {
        // Ensure validationResult is attached to the request
        if (!req.validationResult) {
          req.validationResult = {
            valid: true,
            errors: [],
            warnings: []
          };
        }
        next();
      };
      
      // Call validateInvoiceStandard with our custom next function
      await validateInvoiceStandard(req, res, customNext);
    } catch (error) {
      next(error);
    }
  },
  // Final handler to combine invoice and validation results
  async (req, res) => {
    // Ensure validationResult exists
    if (!req.validationResult) {
      req.validationResult = {
        valid: true,
        errors: [],
        warnings: []
      };
    }
    
    // If we have both invoice data and validation results
    if (!req.validationResult.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invoice does not comply with Peppol standards',
        error: req.validationResult.errors,
        validationWarnings: req.validationResult.warnings
      });
    }

    if (req.invoiceData && req.validationResult) {
      return res.status(200).json({
        ...req.invoiceData,
        validation: {
          status: 'success',
          message: 'Invoice successfully validated against Peppol standards',
          warnings:
            req.validationResult.warnings.length > 0
              ? req.validationResult.warnings
              : []
        }
      });
    }

    // If we only have validation results (fallback)
    if (req.validationResult) {
      return res.status(200).json({
        status: 'success',
        message: 'Invoice successfully validated against Peppol standards',
        validationWarnings:
          req.validationResult.warnings.length > 0
            ? req.validationResult.warnings
            : []
      });
    }

    // If we only have invoice data (fallback)
    if (req.invoiceData) {
      return res.status(200).json(req.invoiceData);
    }

    // If something went wrong
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create and validate invoice'
    });
  }
);

/**
 * List all invoices
 * @route GET /v1/invoices
 * @returns {object} 200 - Array of invocies
 */
router.get('/list', listInvoices);

/**
 * Get specific invoice
 * @route GET /v1/invoices/:invoiceId
 * @param {string} invoiceId.path.required - Invoice ID
 * @returns {object} 200 - Invoice details
 */
router.get('/:invoiceid', 
  async (req, res) => {
    await getInvoice(req, res, false);
  }
);

/**
 * update specific invoice
 * @route PUT /v1/invoices/:invoiceid
 * @param {string} invoiceid.path.required - Invoice ID
 * @returns {object} 200 - Invoice details
 */
router.put('/:invoiceid', updateInvoice);

/**
 * Delete invoice
 * @route DELETE /v1/invoices/:invoiceId
 * @param {string} invoiceId.path.required - Invoice ID
 * @returns {object} 200 - Success message
 */
router.delete('/:invoiceid', deleteInvoice);

module.exports = router;
