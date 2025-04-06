const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');

// Import controllers
const currencyController = require('../controllers/currency.controller');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

/**
 * Get all available exchange rates
 * @route GET /v1/currency/rates
 * @returns {object} 200 - Exchange rates data
 */
router.get('/rates', currencyController.getExchangeRates);

/**
 * Convert invoice amounts to a different currency
 * @route POST /v1/currency/convert
 * @param {object} req.body.invoice - Invoice to convert
 * @param {string} req.body.targetCurrency - Target currency code
 * @returns {object} 200 - Converted invoice
 */
router.post('/convert', currencyController.convertInvoiceCurrency);

module.exports = router; 