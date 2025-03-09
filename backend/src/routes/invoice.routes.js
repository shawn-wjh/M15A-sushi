const express = require('express');

const router = express.Router();

// Import middleware (we'll create these next)
const { validateInvoiceInput } = require('../middleware/invoice-validation');
const { generateUBLInvoice, validateUBLFormat } = require('../middleware/ubl-handler');

// Import controllers (we'll create these next)
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
 * @route POST /v1/invoices/generate
 * @param {object} req.body - Invoice details (IssueDate, DueDate, SupplierName, etc.)
 * @returns {object} 200 - Generated UBL invoice
 */
router.post(
  '/generate',
  validateInvoiceInput, // Validate JSON input
  generateUBLInvoice, // Convert to UBL 2.4 XML
  createInvoice // Store in DynamoDB
);

/**
 * Validate UBL invoice format
 * @route POST /v1/invoices/validate
 * @param {string} req.body.xml - UBL XML content to validate
 * @returns {object} 200 - Validation report
 */
router.post(
  '/validate',
  validateUBLFormat,
  validateInvoice
);

/**
 * List all invoices
 * @route GET /v1/invoices
 * @returns {array} 200 - Array of invoices
 */
router.get(
  '/',
  listInvoices
);

/**
 * Get specific invoice
 * @route GET /v1/invoices/:id
 * @param {string} id.path.required - Invoice ID
 * @returns {object} 200 - Invoice details
 */
router.get(
  '/:id',
  getInvoice
);

/**
 * Download invoice as UBL XML
 * @route GET /v1/invoices/:id/download
 * @param {string} id.path.required - Invoice ID
 * @returns {file} 200 - UBL XML file
 */
router.get(
  '/:id/download',
  downloadInvoice
);

/**
 * Delete invoice
 * @route DELETE /v1/invoices/:id
 * @param {string} id.path.required - Invoice ID
 * @returns {object} 200 - Success message
 */
router.delete(
  '/:id',
  deleteInvoice
);

module.exports = router;
