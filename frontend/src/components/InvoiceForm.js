import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../utils/axiosConfig';
import './InvoiceForm.css';

// Determine base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/v1/invoices'; // Use relative path in production
  }
  return 'http://localhost:3000/v1/invoices'; // Use full URL in development
};

const API_URL = getBaseUrl();

// Helper function to get cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
};

const InvoiceForm = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    invoiceId: '',
    total: 0,
    buyer: '',
    supplier: '',
    issueDate: '',
    dueDate: '',
    currency: 'AUD',
    buyerAddress: {
      street: '',
      country: 'AU'
    },
    supplierAddress: {
      street: '',
      country: 'AU'
    },
    buyerPhone: '',
    items: [
      {
        name: '',
        count: 1,
        cost: 0,
        currency: 'AUD'
      }
    ]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (e.g., buyerAddress.street)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [name]: name === 'total' ? parseFloat(value) || 0 : value
      });
    }
  };

  // Handle item field changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    if (field === 'cost' || field === 'count') {
      // Allow empty values during editing, but treat them as 0 for calculations
      updatedItems[index][field] = value === '' ? '' : parseFloat(value) || 0;
    } else {
      updatedItems[index][field] = value;
    }
    
    // First update the items in the form data
    setFormData(prevData => ({
      ...prevData,
      items: updatedItems
    }));
    
    // Always recalculate total when any item field changes
    setTimeout(() => calculateTotal(updatedItems), 0);
  };

  // Calculate total from items
  const calculateTotal = (items = formData.items) => {
    const total = items.reduce((sum, item) => {
      // Make sure to convert to numbers and multiply count by cost
      // Treat empty strings as 0 for calculation purposes
      const count = item.count === '' ? 0 : parseFloat(item.count);
      const cost = item.cost === '' ? 0 : parseFloat(item.cost);
      const itemTotal = count * cost;
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    
    // Round to 2 decimal places to avoid floating point issues
    const roundedTotal = Math.round(total * 100) / 100;
    
    setFormData(prev => ({
      ...prev,
      total: roundedTotal
    }));
  };

  // Add a new item
  const addItem = () => {
    const updatedItems = [
      ...formData.items,
      {
        name: '',
        count: 1,
        cost: 0,
        currency: formData.currency
      }
    ];
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Recalculate total with the new item
    setTimeout(() => calculateTotal(updatedItems), 0);
  };

  // Remove an item
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      return; // Keep at least one item
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems
    });
    
    // Recalculate total
    calculateTotal(updatedItems);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setCreatedInvoice(null);
    
    try {
      // Convert any empty string values to numbers before validation
      const normalizedItems = formData.items.map(item => ({
        ...item,
        count: item.count === '' ? 0 : parseFloat(item.count),
        cost: item.cost === '' ? 0 : parseFloat(item.cost)
      }));
      
      // Get token from cookie instead of localStorage
      const token = getCookie('token');
      
      if (!token) {
        setMessage({
          type: 'error',
          text: 'You must be logged in to create invoices'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate form data
      if (!formData.invoiceId || !formData.buyer || !formData.supplier || !formData.issueDate) {
        setMessage({
          type: 'error',
          text: 'Please fill in all required fields'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate items with normalized values
      const invalidItems = normalizedItems.some(item => !item.name || item.count <= 0 || item.cost <= 0);
      if (invalidItems) {
        setMessage({
          type: 'error',
          text: 'All items must have a name, positive count, and positive cost'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Calculate the correct total from items
      const calculatedTotal = normalizedItems.reduce((sum, item) => {
        return sum + (item.count * item.cost);
      }, 0);
      
      // Round to 2 decimal places
      const roundedTotal = Math.round(calculatedTotal * 100) / 100;
      
      // Create a new data object with the correct total and normalized items
      const submissionData = {
        ...formData,
        items: normalizedItems,
        total: roundedTotal
      };
      
      console.log('Submitting invoice with total:', roundedTotal);
      console.log('Item costs:', normalizedItems.map(item => ({
        name: item.name,
        count: item.count,
        cost: item.cost,
        itemTotal: item.count * item.cost
      })));
      
      // Send data to backend using the apiClient (which already has auth and base URL config)
      const response = await apiClient.post(
        '/v1/invoices/create-and-validate', 
        submissionData
      );
      
      setMessage({
        type: 'success',
        text: 'Invoice created and validated successfully!'
      });
      
      // Store the created invoice data
      setCreatedInvoice(response.data);
      
      // Reset form after successful submission
      setFormData({
        invoiceId: '',
        total: 0,
        buyer: '',
        supplier: '',
        issueDate: '',
        dueDate: '',
        currency: 'AUD',
        buyerAddress: {
          street: '',
          country: 'AU'
        },
        supplierAddress: {
          street: '',
          country: 'AU'
        },
        buyerPhone: '',
        items: [
          {
            name: '',
            count: 1,
            cost: 0,
            currency: 'AUD'
          }
        ]
      });
      
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'An error occurred while creating the invoice'
      });
      console.error('Invoice creation error:', err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <div className="invoice-form-container">
          {createdInvoice ? (
            <div className="invoice-success">
              <div className="success-icon">✓</div>
              <h3>Invoice Created Successfully!</h3>
              <p>Your invoice has been created and validated.</p>
              
              <div className="invoice-details">
                <div className="detail-item">
                  <span className="detail-label">Invoice ID:</span>
                  <span className="detail-value">{createdInvoice.invoiceId}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value success">{createdInvoice.validation?.status || 'Success'}</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="form-button primary" 
                  onClick={() => setCreatedInvoice(null)}
                >
                  Create Another Invoice
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="welcome-banner">
                <h2>Create New Invoice</h2>
                <p>Fill in the details below to create a new invoice. Required fields are marked with an asterisk (*).</p>
              </div>
              
              <form onSubmit={handleSubmit} className="invoice-form">
                <div className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="invoiceId">Invoice ID *</label>
                      <input
                        type="text"
                        id="invoiceId"
                        name="invoiceId"
                        value={formData.invoiceId}
                        onChange={handleChange}
                        required
                        placeholder="e.g., INV-2023-001"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="currency">Currency</label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                      >
                        <option value="AUD">Australian Dollar (AUD)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="issueDate">Issue Date *</label>
                      <input
                        type="date"
                        id="issueDate"
                        name="issueDate"
                        value={formData.issueDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="dueDate">Due Date</label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Buyer Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="buyer">Buyer Name *</label>
                    <input
                      type="text"
                      id="buyer"
                      name="buyer"
                      value={formData.buyer}
                      onChange={handleChange}
                      required
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="buyerAddress.street">Street Address</label>
                    <input
                      type="text"
                      id="buyerAddress.street"
                      name="buyerAddress.street"
                      value={formData.buyerAddress.street}
                      onChange={handleChange}
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="buyerAddress.country">Country</label>
                      <select
                        id="buyerAddress.country"
                        name="buyerAddress.country"
                        value={formData.buyerAddress.country}
                        onChange={handleChange}
                      >
                        <option value="AU">Australia</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="NZ">New Zealand</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="buyerPhone">Phone Number</label>
                      <input
                        type="tel"
                        id="buyerPhone"
                        name="buyerPhone"
                        value={formData.buyerPhone}
                        onChange={handleChange}
                        placeholder="e.g., +61 123 456 789"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Supplier Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="supplier">Supplier Name *</label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      required
                      placeholder="e.g., ABC Company"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="supplierAddress.street">Street Address</label>
                    <input
                      type="text"
                      id="supplierAddress.street"
                      name="supplierAddress.street"
                      value={formData.supplierAddress.street}
                      onChange={handleChange}
                      placeholder="e.g., 456 Business Ave"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="supplierAddress.country">Country</label>
                    <select
                      id="supplierAddress.country"
                      name="supplierAddress.country"
                      value={formData.supplierAddress.country}
                      onChange={handleChange}
                    >
                      <option value="AU">Australia</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="NZ">New Zealand</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="section-header">
                    <h3>Invoice Items</h3>
                    <button 
                      type="button" 
                      className="add-item-button"
                      onClick={addItem}
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-container">
                      <div className="item-header">
                        <h4>Item {index + 1}</h4>
                        {formData.items.length > 1 && (
                          <button 
                            type="button" 
                            className="remove-item-button"
                            onClick={() => removeItem(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`item-${index}-name`}>Item Name *</label>
                        <input
                          type="text"
                          id={`item-${index}-name`}
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          required
                          placeholder="e.g., Product A"
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`item-${index}-count`}>Quantity *</label>
                          <input
                            type="number"
                            id={`item-${index}-count`}
                            value={item.count}
                            onChange={(e) => handleItemChange(index, 'count', e.target.value)}
                            min="1"
                            step="1"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`item-${index}-cost`}>Unit Price *</label>
                          <input
                            type="number"
                            id={`item-${index}-cost`}
                            value={item.cost}
                            onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`item-${index}-currency`}>Currency</label>
                          <select
                            id={`item-${index}-currency`}
                            value={item.currency}
                            onChange={(e) => handleItemChange(index, 'currency', e.target.value)}
                          >
                            <option value="AUD">AUD</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="item-total">
                        Item Total: {formData.currency} {(item.count * item.cost).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="invoice-total">
                  <span className="total-label">Invoice Total:</span>
                  <span className="total-value">{formData.currency} {formData.total.toFixed(2)}</span>
                </div>
                
                {message && (
                  <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
                    {message.text}
                  </div>
                )}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="form-button secondary"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset the form?')) {
                        setFormData({
                          invoiceId: '',
                          total: 0,
                          buyer: '',
                          supplier: '',
                          issueDate: '',
                          dueDate: '',
                          currency: 'AUD',
                          buyerAddress: {
                            street: '',
                            country: 'AU'
                          },
                          supplierAddress: {
                            street: '',
                            country: 'AU'
                          },
                          buyerPhone: '',
                          items: [
                            {
                              name: '',
                              count: 1,
                              cost: 0,
                              currency: 'AUD'
                            }
                          ]
                        });
                      }
                    }}
                  >
                    Reset
                  </button>
                  
                  <button 
                    type="submit" 
                    className="form-button primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Invoice'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InvoiceForm; 