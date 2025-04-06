/* istanbul ignore file */

/**
 * Utility functions for mapping order data to invoice format
 */

/**
 * Maps order data to invoice format
 * @param {Object} orderData - Data from the order API
 * @param {string} orderId - The original order ID
 * @returns {Object} Data structured for invoice creation
 */
const mapOrderToInvoice = (orderData, orderId) => {
  // Create a safe invoice ID based on the order ID
  const invoiceId = `INV-${orderId.substring(0, 8)}`;
  
  // Extract buyer/customer information
  const buyer = orderData.buyer || {};
  
  // Extract seller information
  const seller = orderData.seller || {};
  
  return {
    // Only include fields we want to pre-fill from order data
    invoiceId: invoiceId,
    issueDate: new Date().toISOString().split('T')[0],
    
    // Basic buyer/seller info from order
    buyer: buyer.buyerName || '',
    supplier: seller.sellerName || '',
    
    // Order items and amounts
    items: orderData.items,
    currency: orderData.currency,
  };
};

module.exports = {
  mapOrderToInvoice
}; 