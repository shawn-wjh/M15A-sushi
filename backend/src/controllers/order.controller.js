const orderService = require('../externalAPI/orderService/orderService');
const { mapOrderToInvoice } = require('../utils/orderMapper');

/**
 * Controller for order-related operations
 */
const orderController = {
  /**
   * Get order details by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  getOrderDetails: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      
      // Get token from header - it's lowercase when Express receives it
      const token = req.headers.token || req.headers['token'] || req.query.token;
      
      if (!orderId) {
        return res.status(400).json({
          status: 'error',
          error: 'Order ID is required'
        });
      }
      
      if (!token) {
        return res.status(400).json({
          status: 'error',
          error: 'Authentication token is required'
        });
      }
      
      // Call the order service to get details
      const orderData = await orderService.getOrderDetails(orderId, token);
      
      return res.status(200).json({
        status: 'success',
        data: orderData
      });
    } catch (error) {
      console.error('Order controller error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },
  
  /**
   * Get invoice template from order data
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  getInvoiceTemplateFromOrder: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      
      // Get token from header - it's lowercase when Express receives it
      const token = req.headers.token || req.headers['token'] || req.query.token;
      
      if (!orderId) {
        return res.status(400).json({
          status: 'error',
          error: 'Order ID is required'
        });
      }
      
      if (!token) {
        return res.status(400).json({
          status: 'error',
          error: 'Authentication token is required'
        });
      }
      
      console.log('Generating invoice template for order:', orderId);
      
      // Call the order service to get details
      const orderData = await orderService.getOrderDetails(orderId, token);
      
      // Map order data to invoice template format using the utility
      const invoiceTemplate = mapOrderToInvoice(orderData, orderId);
      
      return res.status(200).json({
        status: 'success',
        data: invoiceTemplate
      });
    } catch (error) {
      console.error('Order controller error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
};

/**
 * Helper function to get a date X days in the future
 * @param {number} days - Number of days to add
 * @returns {string} ISO date string YYYY-MM-DD
 */
function getDatePlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

module.exports = orderController; 