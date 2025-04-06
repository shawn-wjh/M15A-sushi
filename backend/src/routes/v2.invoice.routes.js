const express = require('express');
const {
  invoiceController
} = require('../controllers/invoice.controller');

const { validateInvoiceStandardv2, validateInvoiceInput } = require('../middleware/invoice-validation');
const { convertToUBL } = require('../middleware/invoice-generation');

const router = express.Router();

const auth = require('../middleware/auth');

router.use(auth.verifyToken);

router.post('/create', invoiceController.createInvoice);

router.post('/:invoiceid/validate', 
  invoiceController.getInvoice,
  validateInvoiceStandardv2,
  invoiceController.updateValidationStatus,
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
    if (req.validationResult.valid) {
      next();
    } else if (req.validationResult.valid === false) {
      return res.status(400).json({
        status: 'error',
        message: 'Invoice validation failed',
        validationResult: req.validationResult
      });
    }
  },
  invoiceController.createInvoice,
  invoiceController.updateValidationStatus,
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

module.exports = router;

