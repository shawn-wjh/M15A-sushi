const express = require('express');
const router = express.Router();

// Import middleware (more needs to be added)
const { validateInvoiceInput, validateInvoiceStandard } = require('../middleware/invoice-validation');
const { generateUBLInvoice } = require('../middleware/invoice-generation');

// Import controllers (more needs to be added)
const { 
    createInvoice,
    validateInvoice,
    listInvoices,
    getInvoice,
    downloadInvoice,
    deleteInvoice 
} = require('../controllers/invoice.controller');

/**
 * Generate UBL 2.4-compliant invoice
 * @route POST /v1/invoices
 * @param {object} req.body - Invoice details (IssueDate, DueDate, SupplierName, etc.)
 * @returns {object} 200 - Generated UBL invoice
 */
router.post('/', 
    validateInvoiceInput,    // Initial Validation of JSON input (correct number of parameters, correct data types, etc.)
    generateUBLInvoice,      // Convert to UBL 2.4 XML
    validateInvoiceStandard, // Validate invoice standard against UBL 2.4, peppol, etc.
    createInvoice            // Outputs the UBL 2.4 XML to the user and stores it in the database
);

/**
 * List all invoices
 * @route GET /v1/invoices
 * @returns {object} 200 - Array of invocies
 */
router.get('/', 
    listInvoices
);

/**
 * Get specific invoice
 * @route GET /v1/invoices/:invoiceId
 * @param {string} invoiceId.path.required - Invoice ID
 * @returns {object} 200 - Invoice details
 */
router.get('/:invoiceId',
    getInvoice
);

/**
 * update specific invoice
 * @route PUT /v1/invoices/:invoiceId
 * @param {string} invoiceId.path.required - Invoice ID
 * @returns {object} 200 - Invoice details
 */
router.put('/:invoiceId',
    updateInvoice
);

/**
 * Delete invoice
 * @route DELETE /v1/invoices/:invoiceId
 * @param {string} invoiceId.path.required - Invoice ID
 * @returns {object} 200 - Success message
 */
router.delete('/:invoiceId',
    deleteInvoice
);

// /**
//  * Download invoice as UBL XML
//  * @route GET /v1/invoices/:invoiceId/download
//  * @param {string} invoiceId.path.required - Invoice ID
//  * @returns {file} 200 - UBL XML file
//  */
// router.get('/:invoiceId/download',
//     downloadInvoice
// );


/**
 * Validate UBL invoice format
 * @route POST /v1/invoices/validate
 * @param {string} req.body.xml - UBL XML content to validate
 * @returns {object} 200 - Validation report
 */
router.post('/validate',
    validateUBLFormat,
    validateInvoice
);

module.exports = router; 