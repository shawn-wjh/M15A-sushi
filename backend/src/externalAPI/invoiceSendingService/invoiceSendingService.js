const axios = require('axios');

/**
 * Service for sending invoices through Peppol network
 */
const invoiceSendingService = {
  /**
   * Send invoice through Peppol network
   * @param {string} ublXml - UBL XML invoice string
   * @param {string} recipientId - Peppol participant ID of recipient
   * @param {string} [apiKey] - User-specific Peppol API key (optional)
   * @param {string} [apiUrl] - User-specific Peppol API URL (optional)
   * @returns {Promise<Object>} Delivery confirmation
   */
  sendInvoice: async (ublXml, recipientId, apiKey, apiUrl) => {
    // Get the base URL and API key from parameters or environment variables
    const PEPPOL_API_URL = apiUrl || process.env.PEPPOL_API_URL;
    const API_KEY = apiKey || process.env.PEPPOL_API_KEY;
    
    if (!PEPPOL_API_URL || !API_KEY) {
      throw new Error('Peppol API URL or API key not configured');
    }
    
    console.log(`Sending invoice to recipient: ${recipientId}`);
    
    try {
      // Send to Peppol Access Point
      const response = await axios.post(
        `${PEPPOL_API_URL}/send`,
        {
          invoice: ublXml,
          recipient: recipientId,
          documentType: 'invoice'
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('Peppol API response status:', response.status);
      
      return {
        status: 'success',
        deliveryId: response.data.deliveryId || response.data.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      
      console.error(`Error sending invoice [${statusCode}]:`, errorMessage);
      
      if (error.response) {
        console.error('Peppol API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('Peppol API did not respond');
      }
      
      // Throw an error with useful details
      throw new Error(`Failed to send invoice: ${errorMessage}`);
    }
  },
  
  /**
   * Check delivery status of sent invoice
   * @param {string} deliveryId - Invoice delivery ID
   * @param {string} [apiKey] - User-specific Peppol API key (optional)
   * @param {string} [apiUrl] - User-specific Peppol API URL (optional)
   * @returns {Promise<Object>} Delivery status
   */
  checkDeliveryStatus: async (deliveryId, apiKey, apiUrl) => {
    // Get the base URL and API key from parameters or environment variables
    const PEPPOL_API_URL = apiUrl || process.env.PEPPOL_API_URL;
    const API_KEY = apiKey || process.env.PEPPOL_API_KEY;
    
    if (!PEPPOL_API_URL || !API_KEY) {
      throw new Error('Peppol API URL or API key not configured');
    }
    
    console.log(`Checking delivery status for: ${deliveryId}`);
    
    try {
      const response = await axios.get(
        `${PEPPOL_API_URL}/status/${deliveryId}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Status check response status:', response.status);
      
      return {
        deliveryId,
        status: response.data.status,
        deliveredAt: response.data.deliveredAt,
        details: response.data
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      
      console.error(`Error checking delivery status [${statusCode}]:`, errorMessage);
      
      throw new Error(`Failed to check delivery status: ${errorMessage}`);
    }
  }
};

module.exports = invoiceSendingService;