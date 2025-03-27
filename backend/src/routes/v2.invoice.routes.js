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

const { validateInvoiceStandardv2 } = require('../middleware/invoice-validation');

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

router.post('/:invoiceid/update', 
  // to add user validation
  updateInvoice
);

router.delete('/:invoiceid', 
  // to add user validation
  deleteInvoice
);

module.exports = router;

