const express = require('express');

const router = express.Router();

const {
  createInvoice,
  getInvoice,
  updateValidationStatus
} = require('../controllers/invoice.controller');

const { validateInvoiceStandard } = require('../middleware/invoice-validation');

router.post('/create', createInvoice);

router.post('/:invoiceid/validate', 
  getInvoice,
  validateInvoiceStandard,
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

module.exports = router;

