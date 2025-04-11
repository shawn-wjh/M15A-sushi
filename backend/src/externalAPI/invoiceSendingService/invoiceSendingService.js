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
   * @param {string} [sendEndpoint] - User-specific send endpoint path (optional)
   * @returns {Promise<Object>} Delivery confirmation
   */
  sendInvoice: async (ublXml, recipientId, apiKey, apiUrl, sendEndpoint) => {
    // Get the base URL and API key from parameters or environment variables
    const PEPPOL_API_URL = apiUrl || process.env.PEPPOL_API_URL;
    const API_KEY = apiKey || process.env.PEPPOL_API_KEY;
    const SEND_ENDPOINT = sendEndpoint || process.env.PEPPOL_SEND_ENDPOINT || 'send';
    
    if (!PEPPOL_API_URL || !API_KEY) {
      throw new Error('Peppol API URL or API key not configured');
    }
    
    console.log(`Sending invoice to recipient: ${recipientId}`);
    
    try {
      // Construct the full URL, handling trailing/leading slashes
      const baseUrl = PEPPOL_API_URL.endsWith('/') ? PEPPOL_API_URL.slice(0, -1) : PEPPOL_API_URL;
      const endpoint = SEND_ENDPOINT.startsWith('/') ? SEND_ENDPOINT : `/${SEND_ENDPOINT}`;
      const fullUrl = `${baseUrl}${endpoint}`;

      // Send to Peppol Access Point
      const response = await axios.post(
        fullUrl,
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
   * @param {string} [statusEndpoint] - User-specific status endpoint path (optional)
   * @returns {Promise<Object>} Delivery status
   */
  checkDeliveryStatus: async (deliveryId, apiKey, apiUrl, statusEndpoint) => {
    // Get the base URL and API key from parameters or environment variables
    const PEPPOL_API_URL = apiUrl || process.env.PEPPOL_API_URL;
    const API_KEY = apiKey || process.env.PEPPOL_API_KEY;
    const STATUS_ENDPOINT = statusEndpoint || process.env.PEPPOL_STATUS_ENDPOINT || 'status';
    
    if (!PEPPOL_API_URL || !API_KEY) {
      throw new Error('Peppol API URL or API key not configured');
    }
    
    console.log(`Checking delivery status for: ${deliveryId}`);
    
    try {
      // Construct the full URL, handling trailing/leading slashes
      const baseUrl = PEPPOL_API_URL.endsWith('/') ? PEPPOL_API_URL.slice(0, -1) : PEPPOL_API_URL;
      const endpoint = STATUS_ENDPOINT.startsWith('/') ? STATUS_ENDPOINT : `/${STATUS_ENDPOINT}`;
      const fullUrl = `${baseUrl}${endpoint}/${deliveryId}`;

      const response = await axios.get(
        fullUrl,
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