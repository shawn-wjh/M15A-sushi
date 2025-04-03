const express = require('express');
const {
  createInvoice,
  getInvoice,
  updateValidationStatus,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoice.controller');

const { validateInvoiceStandardv2, validateInvoiceInput } = require('../middleware/invoice-validation');
const { convertToUBL } = require('../middleware/invoice-generation');

const router = express.Router();

const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

// call createInvoice controller without calling next
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
  (req, res, next) => {
    if (req.body.invoice) {
      req.body.xml = convertToUBL(req.body.invoice);
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No invoice provided'
      });
    }
    next();
  },
  validateInvoiceInput,
  validateInvoiceStandardv2,
  (req, res, next) => {
    console.log('checking if validation passed...');
    console.log('req.validationResult: ', req.validationResult);
    if (req.validationResult.valid) {
      next();
    } else if (req.validationResult.valid === false) {
      console.log('validation failed');
      return res.status(400).json({
        status: 'error',
        message: 'Invoice validation failed',
        validationResult: req.validationResult
      });
    }
  },
  createInvoice,
  updateValidationStatus,
  (req, res) => {
    if (req.status === 'success') {
      return res.status(200).json({
        status: 'success',
        message: 'Invoice created and validated successfully',
        invoiceId: req.params.invoiceid,
        validationWarnings: req.validationResult.warnings
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create invoice',
      });
    }
  }
);

router.put('/:invoiceid/update', 
  updateInvoice
);

router.delete('/:invoiceid', 
  // to add user validation
  deleteInvoice
);

module.exports = router;

