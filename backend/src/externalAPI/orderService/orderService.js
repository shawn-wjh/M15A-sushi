/* istanbul ignore file */

const axios = require('axios');

/**
 * Service for interacting with the external Order API
 */
const orderService = {
  /**
   * Get order details by order ID
   * @param {string} orderId - The ID of the order to retrieve
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Order details
   */
  getOrderDetails: async (orderId, token) => {
    // Get the base URL from environment variables
    const ORDER_API_URL = process.env.ORDER_API_URL || 'http://3.25.80.104:49153';
    
    // The external API endpoint
    const url = `${ORDER_API_URL}/v1/admin/orders/${orderId}`;
    
    console.log(`Making request to external API: ${url}`);
    
    try {
      const response = await axios.get(`${ORDER_API_URL}/v1/admin/orders/${orderId}`, {
        headers: {
          'token': token,
          'Content-Type': 'application/json'
        },
        // Set a timeout to avoid hanging requests
        timeout: 10000
      });
      
      console.log('External API response status:', response.status);
      
      // If response doesn't have data property, wrap the response in a data object
      const orderData = response.data || {};
      
      // Add a fallback for empty responses
      if (Object.keys(orderData).length === 0) {
        console.warn('External API returned empty data');
        return {
          customer: { name: 'Unknown Customer' },
          items: [],
          currency: 'AUD'
        };
      }
      
      return orderData;
    } catch (error) {
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      
      console.error(`Error fetching order details [${statusCode}]:`, errorMessage);
      
      if (error.response) {
        console.error('External API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('External API did not respond');
      }
      
      // Throw an error with useful details
      throw new Error(`Failed to fetch order details: ${errorMessage}`);
    }
  }
};

module.exports = orderService;
