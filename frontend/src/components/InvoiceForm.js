import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../utils/axiosConfig';
import './InvoiceForm.css';
import OrderSearch from './OrderSearch';
import { schemaNameMap } from './invoiceValidationResult/validationResults';
import { useHistory, useLocation } from 'react-router-dom';
import MenuBar from './MenuBar';
import TopBar from './TopBar';
// Determine base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/v2/invoices'; // Use relative path in production
  }
  return 'http://localhost:3000/v2/invoices'; // Use full URL in development
};

const API_URL = getBaseUrl();

// Helper function to get cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
};

// Initial form state
const initialFormState = {
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
  supplierPhone: '',
  supplierEmail: '',
  taxTotal: 0,
  taxRate: 10, // Default 10% GST for Australia
  items: [
    {
      name: '',
      count: 1,
      cost: 0,
      currency: 'AUD'
    }
  ]
};

const InvoiceForm = ({ editMode = false, invoiceToEdit = null }) => {
  const history = useHistory();
  const location = useLocation();
  const formRef = useRef(null);
  const [formData, setFormData] = useState(initialFormState);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [wasValidated, setWasValidated] = useState(false);
  const [submittedValues, setSubmittedValues] = useState(null);
  const [selectedSchemas, setSelectedSchemas] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Initialize form with invoice data if in edit mode
  useEffect(() => {
    if (editMode && invoiceToEdit) {
      // Map the invoice data to the form structure
      const invoiceId = location.pathname.split('/').pop();

      // map invoice placeholer values
      const mappedData = {
        ...initialFormState,
        invoiceId: invoiceToEdit.invoiceId || '',
        total: parseFloat(invoiceToEdit.total) || 0,
        buyer: invoiceToEdit.buyer.name || '',
        supplier: invoiceToEdit.supplier.name || '',
        issueDate: invoiceToEdit.issueDate || '',
        dueDate: invoiceToEdit.dueDate || '',
        currency: invoiceToEdit.currency || 'AUD',
        buyerAddress: {
          street: invoiceToEdit.buyer.address?.street || '',
          country: invoiceToEdit.buyer.address?.country || 'AU'
        },
        supplierAddress: {
          street: invoiceToEdit.supplier.address?.street || '',
          country: invoiceToEdit.supplier.address?.country || 'AU'
        },
        buyerPhone: invoiceToEdit.buyer.phone || '',
        supplierPhone: invoiceToEdit.supplier.phone || '',
        supplierEmail: invoiceToEdit.supplier.email || '',
        taxTotal: parseFloat(invoiceToEdit.taxTotal) || 0,
        taxRate: parseFloat(invoiceToEdit.taxRate) || 10,
        items: invoiceToEdit.items?.length > 0 
          ? invoiceToEdit.items.map(item => ({
              name: item.name || '',
              count: parseInt(item.count) || 1,
              cost: parseFloat(item.cost) || 0,
              currency: item.currency || invoiceToEdit.currency || 'AUD'
            }))
          : initialFormState.items
      };
      
      setFormData(mappedData);
    }
  }, [editMode, invoiceToEdit]);

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
    setFormData(prevData => {
      const newData = {
        ...prevData,
        items: updatedItems
      };
      
      // Calculate total after state update is complete
      setTimeout(() => calculateTotal(updatedItems), 0);
      
      return newData;
    });
  };

  // Handle tax rate change
  const handleTaxRateChange = (e) => {
    // Allow empty input field
    const newTaxRate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        taxRate: newTaxRate
      };
      
      // Recalculate tax amount with new rate (use 0 if field is empty)
      const calcRate = newTaxRate === '' ? 0 : newTaxRate;
      setTimeout(() => calculateTotal(formData.items, calcRate), 0);
      
      return newData;
    });
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
    
    setFormData(prev => {
      const newData = {
        ...prev,
        items: updatedItems
      };
      
      // Calculate total after state update is complete
      setTimeout(() => calculateTotal(updatedItems), 0);
      
      return newData;
    });
  };

  // Remove an item
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      return; // Keep at least one item
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => {
      const newData = {
        ...prev,
        items: updatedItems
      };
      
      // Calculate total after state update is complete
      setTimeout(() => calculateTotal(updatedItems), 0);
      
      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e, shouldValidate = false) => {
    e.preventDefault();
    
    // Check if the all required fields are filled (unless in edit mode)
    if (!formRef.current.checkValidity() && !editMode) {
      formRef.current.reportValidity();
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    setCreatedInvoice(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    
    try {
      // Convert any empty string values to numbers before validation
      const normalizedItems = formData.items.map(item => ({
        ...item,
        count: item.count === '' ? 0 : parseFloat(item.count),
        cost: item.cost === '' ? 0 : parseFloat(item.cost)
      }));
      
      const token = getCookie('token');
      
      if (!token) {
        setMessage({
          type: 'error',
          text: 'You must be logged in to create invoices'
        });
        setIsSubmitting(false);
        return;
      }

      // convert dates to YYYY-MM-DD format
      const formattedIssueDate = formData.issueDate ? new Date(formData.issueDate).toISOString().split('T')[0] : '';
      const formattedDueDate = formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : '';
      
      // Calculate the correct total from items
      const calculatedTotal = normalizedItems.reduce((sum, item) => {
        return sum + (item.count * item.cost);
      }, 0);
      
      // Round to 2 decimal places
      const roundedTotal = Math.round(calculatedTotal * 100) / 100;
      
      // Ensure tax rate is a number
      const taxRate = formData.taxRate === '' ? 0 : parseFloat(formData.taxRate);
      
      // Calculate tax amount based on subtotal
      const taxAmount = Math.round(roundedTotal * (taxRate / 100) * 100) / 100;
      
      // Create a new data object with the correct total, tax data, and normalized items
      const submissionData = {
        ...formData,
        total: roundedTotal,
        issueDate: formattedIssueDate,
        dueDate: formattedDueDate,
        taxRate: taxRate,
        taxAmount: taxAmount,
        taxTotal: taxAmount, // Consistent naming
        totalWithTax: roundedTotal + taxAmount,
        supplierContact: {
          phone: formData.supplierPhone || '',
          email: formData.supplierEmail || ''
        },
        // Add explicit tax data in the format expected by the backend
        taxTotal: taxAmount,
        // Add tax information to each line item
        items: normalizedItems.map(item => ({
          ...item,
          taxCategory: 'S', // Standard rate
          taxPercent: taxRate
        })),
      };
      
      // Save submitted values for display
      const displayValues = {
        ...submissionData,
        subtotal: roundedTotal,
        taxAmount: taxAmount,
        taxRate: taxRate,
        total: roundedTotal + taxAmount,
      };
      setSubmittedValues(displayValues);
      
      // Send data to backend using the apiClient
      let response;
      
      if (editMode) {
        // If in edit mode, use the update endpoint
        const invoiceIdPath = location.pathname.split('/').pop();
        response = await apiClient.put(`${API_URL}/${invoiceIdPath}/update`, submissionData);
        
        if (response.status === 200) {
          setMessage({
            type: 'success',
            text: 'Invoice updated successfully!'
          });
          
        } else {
          setMessage({
            type: 'error',
            text: 'Something went wrong while updating the invoice: ' + response.data.error
          });
        }
      } else if (shouldValidate) {
        response = await apiClient.post(`${API_URL}/create-and-validate`, { 
          schemas: selectedSchemas, 
          invoice: submissionData 
        });

        if (response.status === 200) {
          setMessage({
            type: 'success',
            text: 'Invoice created and validated successfully!'
          });
          setWasValidated(true);
        } else if (response.status === 400) {
          setMessage({
            type: 'error',
            text: 'Invoice failed validation against ' + selectedSchemas.map((schema) => schemaNameMap[schema]).join(', ')
          });
          setValidationErrors(response.data.validationResult.errors || []);
          setValidationWarnings(response.data.validationResult.warnings || []);
          setWasValidated(false);
          setIsSubmitting(false);
          return;
        } else {
          setMessage({
            type: 'error',
            text: 'Something went wrong while creating and validating the invoice: ' + response.data.error
          });
        }
      } else {
        response = await apiClient.post(`${API_URL}/create`, submissionData);
        
        if (response.status === 200) {
          setMessage({
            type: 'success',
            text: 'Invoice created successfully!'
          });
        } else {
          setMessage({
            type: 'error',
            text: 'Something went wrong while creating the invoice: ' + response.data.error
          });
        }
      }
      
      // Store the created invoice data
      setCreatedInvoice(response.data);
      
      // Reset form after successful submission
      if (!editMode) {
        resetForm();
      }
      
    } catch (err) {
      console.error('Invoice creation error:', err);
      
      let errorMessage = 'An error occurred while creating the invoice';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                      err.response.data?.message || 
                      `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        errorMessage = err.message || 'Request setup error';
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialFormState);
    setMessage(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    setSelectedSchemas([]);
  };

  // Handle order selection from OrderSearch component
  const handleOrderSelect = (orderData) => {

    // Create a properly structured form data object with default values
    const formattedData = {
      // Map the received data to form fields
      invoiceId: orderData.invoiceId || '',
      total: 0,
      buyer: orderData.buyer || '',
      supplier: orderData.supplier || '',
      issueDate: orderData.issueDate || '',
      dueDate: '',
      currency: orderData.currency || 'AUD',
      // Ensure these objects exist with default values
      buyerAddress: {
        street: '',
        country: 'AU'
      },
      supplierAddress: {
        street: '',
        country: 'AU'
      },
      buyerPhone: '',
      supplierPhone: '',
      supplierEmail: '',
      taxTotal: 0,
      taxRate: 10,
      // Handle empty or missing items array
      items: Array.isArray(orderData.items?.[0]) ? 
        // If items is an empty array inside array, create default item
        [{ name: '', count: 1, cost: 0, currency: orderData.currency || 'AUD' }] :
        // If items exist, map them
        (orderData.items || []).map(item => ({
          name: item.description || '',
          count: item.quantity || 1,
          cost: item.unitPrice || 0,
          currency: orderData.currency || 'AUD'
        }))
    };

    // Update form with the properly structured data
    setFormData(formattedData);
    
    // Reset any previous submission state
    setCreatedInvoice(null);
    setWasValidated(false);
    setSubmittedValues(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    
    // Calculate totals based on the items
    setTimeout(() => calculateTotal(formattedData.items), 0);
  };

  const handleSchemaChange = (schema) => {
    setSelectedSchemas((prev) => {
      if (prev.includes(schema)) {
        return prev.filter((s) => s !== schema);
      }
      return [...prev, schema];
    });
  };

  // Format error message to display each error on a separate line
  const formatMessage = (message) => {
    if (!message) return '';
    
    // Ensure message is a string
    const text = typeof message.text === 'string' ? message.text : String(message.text);
    
    // Generic handler for error messages containing validation rules
    if (text.includes('Peppol rule')) {
      // Extract individual errors using regex
      const errorRegex = /Missing[^(]+ \(Peppol rule [^)]+\)/g;
      const matches = text.match(errorRegex);
      
      if (matches && matches.length > 0) {
        // Remove duplicate errors
        const uniqueErrors = [...new Set(matches)];
        
        // Return as a list
        return (
          <ul className="error-list">
            {uniqueErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        );
      }
    }

    // include schemas if successfully validated
    if (message.type === 'success' && selectedSchemas.length > 0) {
      return (
        <>
          <p>
            Validation was performed against the following schemas:
            <ul className="validation-schema-list">
              {selectedSchemas.map((schema) => (
                <li key={schema}>{schemaNameMap[schema]}</li>
              ))}
            </ul>
          </p>

          {/* include validation warnings if any */}
          { validationWarnings.length > 0 && (
            <p>
              Validation warnings:
              <ul className="validation-warnings-list">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul> 
            </p>
          )}
        </>
      );
    }
    
    return text;
  };

  // Calculate total from items
  const calculateTotal = (items = formData.items, taxRate = formData.taxRate) => {
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
    
    // Calculate tax amount based on tax rate
    const taxTotal = Math.round(roundedTotal * (taxRate / 100) * 100) / 100;
    
    setFormData(prev => ({
      ...prev,
      total: roundedTotal,
      taxTotal: taxTotal
    }));
  };

  return (
    <div className="dashboard-page">
      <MenuBar activeSection="invoices" />
      <div className="invoice-page-content">
        <TopBar />
        <main className="content-area">
        <div className="invoice-form-container">
          {createdInvoice ? (
            <div className="invoice-success">
              <div className="success-icon">✓</div>
              <h3>{editMode ? 'Invoice Updated Successfully!' : 'Invoice Created Successfully!'}</h3>
              <p>Your invoice has been {editMode ? 'updated' : (wasValidated ? 'created and validated' : 'created')}</p>
              
              <div className="invoice-details">
                <div className="detail-item">
                  <span className="detail-label">Invoice ID:</span>
                  <span className="detail-value">{createdInvoice.invoiceId}</span>
                </div>
                
                {wasValidated && (
                  <div className="detail-item">
                    <span className="detail-label">Validation:</span>
                    <span className="detail-value success">{'Successfully validated against: ' + selectedSchemas.map((schema) => schemaNameMap[schema]).join(', ')}</span>
                  </div>
                )}
                
                <div className="detail-item">
                  <span className="detail-label">Subtotal:</span>
                  <span className="detail-value">
                    {submittedValues?.currency || createdInvoice.currency} {parseFloat(submittedValues?.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Tax ({parseFloat(submittedValues?.taxRate || 0).toFixed(1)}%):</span>
                  <span className="detail-value">
                    {submittedValues?.currency || createdInvoice.currency} {parseFloat(submittedValues?.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value total">
                    {submittedValues?.currency || createdInvoice.currency} {parseFloat(submittedValues?.total || 0).toFixed(2)}
                  </span>
                </div>

                { validationWarnings.length > 0 && (
                  <div className="validation-warnings">
                    Validation warnings:
                    <ul className="validation-warnings-list">
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul> 
                  </div>
                )}
              </div>

              
              <div className="form-actions">
                {!editMode ? (<button 
                  className="form-button primary" 
                  onClick={() => {
                    setMessage(null);
                    setValidationWarnings([]);
                    setSelectedSchemas([]);
                    setCreatedInvoice(null);
                    setSubmittedValues(null);
                  }}
                >
                  Create Another Invoice
                </button>) : (<button 
                  className="form-button primary" 
                  onClick={() => {
                    setMessage(null);
                    setValidationWarnings([]);
                    setSelectedSchemas([]);
                    setCreatedInvoice(null);
                    setSubmittedValues(null);
                    history.push(`/invoices/${createdInvoice.invoiceId}`);
                  }}
                >
                  Back to Invoice
                </button>)}
              </div>
            </div>
          ) : (
            <>
              <div className="welcome-banner">
                <h2>{editMode ? 'Edit Invoice' : 'Create New Invoice'}</h2>
                <p>{editMode ? 'Edit the invoice details below.' : 'Fill in the details below to create a new invoice. Required fields are marked with an asterisk (*).'}</p>
              </div>
              
              {!editMode && <OrderSearch onOrderSelect={handleOrderSelect} />}
              
              <form 
                className="invoice-form" 
                ref={formRef} 
                noValidate
                onSubmit={(e) => handleSubmit(e, selectedSchemas.length > 0)}
              >
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
                        aria-required="true"
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
                        aria-required="true"
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
                      aria-required="true"
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
                      aria-required="true"
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
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="supplierPhone">
                        Phone Number <span className="required-note">*</span>
                      </label>
                      <input
                        type="tel"
                        id="supplierPhone"
                        name="supplierPhone"
                        value={formData.supplierPhone}
                        onChange={handleChange}
                        placeholder="e.g., +61 123 456 789"
                        required
                        aria-required="true"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="supplierEmail">
                        Email Address <span className="required-note">*</span>
                      </label>
                      <input
                        type="email"
                        id="supplierEmail"
                        name="supplierEmail"
                        value={formData.supplierEmail}
                        onChange={handleChange}
                        placeholder="e.g., supplier@example.com"
                        required
                        aria-required="true"
                      />
                      {selectedSchemas.includes('peppol') && <div className="field-note">* At least one contact method required for Peppol validation</div>}
                    </div>
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
                          name={`item-${index}-name`}
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`item-${index}-count`}>Count *</label>
                        <input
                          type="text"
                          id={`item-${index}-count`}
                          name={`item-${index}-count`}
                          value={item.count}
                          onChange={(e) => handleItemChange(index, 'count', e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`item-${index}-cost`}>Cost *</label>
                        <input
                          type="text"
                          id={`item-${index}-cost`}
                          name={`item-${index}-cost`}
                          value={item.cost}
                          onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                          required
                          aria-required="true"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="form-section">
                  <h3>Tax Information</h3>
                  <div className="tax-configuration">
                    <div className="form-group">
                      <label htmlFor="taxRate">
                        Tax Rate (%) <span className="required-indicator">*</span>
                      </label>
                      <div className="tax-rate-input">
                        <input
                          type="number"
                          id="taxRate"
                          name="taxRate"
                          value={formData.taxRate}
                          onChange={handleTaxRateChange}
                          min="0"
                          step="0.1"
                          className="tax-rate-field"
                          required
                          aria-required="true"
                        />
                        <span className="tax-rate-symbol">%</span>
                      </div>
                      <div className="tax-rate-help">
                        Enter the applicable tax rate (e.g., 10 for 10% GST in Australia). 
                        Required for Peppol validation.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-section totals-section">
                  <h3>Invoice Summary</h3>
                  <div className="invoice-summary">
                    <div className="summary-row">
                      <span className="summary-label">Subtotal:</span>
                      <span className="summary-value">{formData.currency} {formData.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="summary-row tax-row">
                      <div className="tax-rate-display">
                        <span className="summary-label">Tax ({formData.taxRate === '' ? '0' : formData.taxRate}%):</span>
                      </div>
                      <span className="summary-value">{formData.currency} {formData.taxTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="summary-row total-row">
                      <span className="summary-label">Total (inc. tax):</span>
                      <span className="summary-value total">{formData.currency} {(formData.total + formData.taxTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                { !editMode && (
                  <div className="form-section">
                    <h3>Validation</h3>
                    <p>Optional: Select the schemas you want to validate against</p>
                    <div className="validation-schemas">
                      <div 
                    className={`schema-option ${selectedSchemas.includes('peppol') ? 'selected' : ''}`}
                    onClick={() => handleSchemaChange('peppol')}
                  >
                    <input 
                      type="checkbox" 
                      value="peppol" 
                      checked={selectedSchemas.includes('peppol')}
                      onChange={() => handleSchemaChange('peppol')} 
                    />
                    <label>PEPPOL (A-NZ)</label>
                  </div>
                  <div 
                    className={`schema-option ${selectedSchemas.includes('fairwork') ? 'selected' : ''}`}
                    onClick={() => handleSchemaChange('fairwork')}
                  >
                    <input 
                      type="checkbox" 
                      value="fairwork" 
                      checked={selectedSchemas.includes('fairwork')}
                      onChange={() => handleSchemaChange('fairwork')} 
                    />
                    <label>Fairwork Commission</label>
                  </div>
                  </div>
                </div>
                )}
                
                {message && (
                  <div className={`message ${message.type}`}>
                    {formatMessage(message)}
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="validation-errors">
                    <h5>Errors:</h5>
                    <ul>
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationWarnings.length > 0 && (
                  <div className="validation-warnings">
                    <h5>Warnings:</h5>
                    <ul>
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="form-button secondary"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset the form?')) {
                        resetForm();
                        window.scrollTo(0, 0);
                      }
                    }}
                  >
                    Reset
                  </button>

                  { !editMode ? <button 
                    type="submit" 
                    className="form-button primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 
                    selectedSchemas.length > 0 ? 'Create & Validate Invoice' : 
                    'Create Invoice'}
                  </button> : <button 
                    type="submit" 
                    className="form-button primary" 
                    disabled={isSubmitting}
                  >
                    Update Invoice
                  </button>}
                </div>
              </form>
            </>
          )}
        </div>
        </main>
        </div>
    </div>
  );
};

export default InvoiceForm;