const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { invoiceController } = require('../controllers/invoice.controller');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

// Export routes
router.get('/:invoiceid/xml', 
    invoiceController.getInvoice,
    exportController.exportInvoiceXML
);

router.get('/:invoiceid/pdf', 
    invoiceController.getInvoice,
    exportController.exportInvoicePDF
);

router.get('/:invoiceid/csv', 
    invoiceController.getInvoice,
    exportController.exportInvoiceCSV
);

module.exports = router;
