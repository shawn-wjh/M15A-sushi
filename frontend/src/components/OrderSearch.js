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
  const [error, setError] = useState(null);
  
  /**
   * Fetches an invoice template based on the order ID
   */
  const handleFetchOrder = async () => {
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
      // Using axios directly instead of apiClient to explicitly set all headers
      const response = await apiClient.get(`/v1/admin/orders/${orderId}/invoice-template`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'token': tokenInput
        },
        withCredentials: true
      });
      
      // If successful, call the onOrderSelect callback with the template data
      if (response.data && response.data.status === 'success') {
        onOrderSelect(response.data.data);
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
        
        <button 
          className="fetch-order-button"
          onClick={handleFetchOrder}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Order Data'}
        </button>
      </div>
      
      {error && (
        <div className="order-search-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default OrderSearch; 