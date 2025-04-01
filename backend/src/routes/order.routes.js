const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');

// Import controllers
const orderController = require('../controllers/order.controller');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

/**
 * Get order details by ID
 * @route GET /v1/orders/:orderId
 * @param {string} token.header.required - External API token
 * @returns {object} 200 - Order details
 */
router.get('/:orderId', orderController.getOrderDetails);

/**
 * Get invoice template from order
 * @route GET /v1/orders/:orderId/invoice-template
 * @param {string} token.header.required - External API token
 * @returns {object} 200 - Invoice template populated with order data
 */
router.get('/:orderId/invoice-template', orderController.getInvoiceTemplateFromOrder);

module.exports = router; 