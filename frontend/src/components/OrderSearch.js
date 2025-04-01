import React, { useState } from 'react';
import axios from 'axios';
import getCookie from '../utils/cookieHelper';
import './OrderSearch.css';
import apiClient from '../utils/axiosConfig';
/**
 * Component for searching orders and using them to populate the invoice form
 * @param {Function} onOrderSelect - Callback function when an order is selected
 */
const OrderSearch = ({ onOrderSelect }) => {
  const [orderId, setOrderId] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrderData, setShowOrderData] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  // Helper function to flatten the order data
  const flattenOrderData = (data) => {
    const flattened = {};
    
    // Helper function to recursively flatten objects
    const flatten = (obj, prefix = '') => {
      for (const key in obj) {
        if (key === 'items' && Array.isArray(obj[key])) {
          // Special handling for items array
          const itemsFormatted = obj[key].map((item, index) => {
            const itemDetails = [];
            for (const [itemKey, itemValue] of Object.entries(item)) {
              itemDetails.push(`${itemKey}: ${itemValue}`);
            }
            return `Item ${index + 1}:\n  ${itemDetails.join('\n  ')}`;
          }).join('\n\n');
          flattened[key] = itemsFormatted || 'No items';
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          flatten(obj[key], `${prefix}${key}_`);
        } else if (Array.isArray(obj[key])) {
          // Handle other arrays by joining values
          flattened[`${prefix}${key}`] = obj[key].join(', ');
        } else {
          flattened[`${prefix}${key}`] = obj[key];
        }
      }
    };
    
    flatten(data);
    return flattened;
  };
  
  /**
   * Fetches an invoice template based on the order ID
   */
  const handleFetchOrder = async (forTemplate = true) => {
    // Validate input
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }
    
    if (!tokenInput.trim()) {
      setError('Please enter an API token');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the auth token for our own API
      const authToken = getCookie("token");
      if (!authToken) {
        setError('You need to be logged in');
        setIsLoading(false);
        return;
      }
      
      // Call our backend API with the orderId and token
      const endpoint = forTemplate ? `/v1/admin/orders/${orderId}/invoice-template` : `/v1/admin/orders/${orderId}`;
      const response = await apiClient.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'token': tokenInput
        },
        withCredentials: true
      });
      
      if (response.data && response.data.status === 'success') {
        if (forTemplate) {
          onOrderSelect(response.data.data);
        } else {
          setOrderData(response.data.data);
          setShowOrderData(true);
        }
      } else {
        setError('Failed to get order data');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      let errorMessage = 'Failed to fetch order data';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your network connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeOrderDataPopup = () => {
    setShowOrderData(false);
    setOrderData(null);
  };
  
  return (
    <div className="order-search-container">
      <h3>Create Invoice from Order</h3>
      
      <div className="order-search-form">
        <div className="form-group">
          <label htmlFor="orderId">Order ID</label>
          <input
            type="text"
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order ID"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="orderToken">API Token</label>
          <input
            type="text"
            id="orderToken"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter API token"
            disabled={isLoading}
          />
        </div>
        
        <div className="button-group">
          <button 
            className="fetch-order-button"
            onClick={() => handleFetchOrder(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Fetch Order Data to Invoice'}
          </button>
          
          <button 
            className="display-order-button"
            onClick={() => handleFetchOrder(false)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Display Order Data'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="order-search-error">
          {error}
        </div>
      )}

      {showOrderData && orderData && (
        <div className="order-data-popup">
          <div className="popup-content">
            <h4>Order Details</h4>
            <div className="order-details">
              {Object.entries(flattenOrderData(orderData))
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, value]) => (
                  <div key={key} className="detail-row">
                    <span className="detail-label">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="detail-value">
                      {value?.toString() || 'N/A'}
                    </span>
                  </div>
              ))}
            </div>
            <button className="close-button" onClick={closeOrderDataPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSearch; 