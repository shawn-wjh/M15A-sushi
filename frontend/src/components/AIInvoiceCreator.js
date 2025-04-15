// frontend/src/components/AIInvoiceCreator.js
import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './AIInvoiceCreator.css';
import AppLayout from './AppLayout';

const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return '/v2/invoices'; // Use relative path in production
    }
    return 'http://localhost:3000/v2/invoices'; // Use full URL in development
};

const API_URL = getBaseUrl();

const AIInvoiceCreator = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m Sushi AI, your invoice creation assistant. Describe the invoice you want to create, or upload an image of an existing invoice. You can ask me anything about invoice creation!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const history = useHistory();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setShowImagePreview(true);

      // Add a user message showing the uploaded image
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessages(prev => [
          ...prev,
          {
            role: 'user',
            content: 'I\'m uploading an invoice image.',
            image: reader.result
          }
        ]);
        
        // Automatically process the image
        processImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() && !imageFile) return;
    
    // Add user message to chat
    const userMessage = input.trim();
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage }
    ]);
    
    // Clear input
    setInput('');
    
    // Process the message
    await processTextMessage(userMessage);
  };

  const processTextMessage = async (text) => {
    setIsLoading(true);
    
    try {
      // Get all messages except the initial welcome message
      const conversationHistory = messages.slice(1);
      
      const response = await apiClient.post('/v1/ai/text-to-invoice', { 
        prompt: text,
        conversation: conversationHistory
      });
      
      if (response.data.success) {
        // Add AI response to messages
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: response.data.message
          }
        ]);
        
        // If we have invoice data, set it for preview
        if (response.data.hasInvoiceData && response.data.data) {
          setInvoiceData(response.data.data);
          setShowInvoicePreview(true);
        }
      } else {
        // Handle error
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'I\'m having trouble processing your request. Can you provide more details?' }
        ]);
      }
    } catch (error) {
      console.error('Error processing text:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        }
      ]);
    }
    
    setIsLoading(false);
  };

  const processImageFile = async (file) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add conversation history to the form data
      const conversationHistory = messages.slice(1);
      formData.append('conversation', JSON.stringify(conversationHistory));
      
      const response = await apiClient.post('/v1/ai/image-to-invoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Add AI response to messages
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: response.data.message
          }
        ]);
        
        // If we have invoice data, set it for preview
        if (response.data.hasInvoiceData && response.data.data) {
          setInvoiceData(response.data.data);
          setShowInvoicePreview(true);
        }
      } else {
        // Handle error
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: 'I\'m having trouble processing the image. Could you try a clearer image or provide the details through text instead?' 
          }
        ]);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your image. Please try again or provide the details through text.' 
        }
      ]);
    }
    
    setIsLoading(false);
    
    // Reset image file and preview after processing
    setImageFile(null);
    setShowImagePreview(false);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleCreateInvoice = () => {
    if (invoiceData) {
      // Check if all required fields are present
      if (isInvoiceDataComplete(invoiceData)) {
        // Call API to directly create the invoice
        createInvoiceDirectly();
      } else {
        // Navigate to invoice form with pre-filled data for manual completion
        history.push({
          pathname: '/invoices/create',
          state: { invoiceData }
        });
      }
    }
  };

  // Function to directly create the invoice through API
  const createInvoiceDirectly = async () => {
    setIsLoading(true);
    try {
      // Transform the invoiceData to the format expected by the API
      const requestData = {
        invoice: {
          invoiceId: invoiceData.invoiceId || generateInvoiceId(),
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate || calculateDefaultDueDate(invoiceData.issueDate),
          currency: invoiceData.currency,
          buyer: {
            name: invoiceData.buyer.name,
            address: invoiceData.buyer.address || { street: '', country: 'AU' },
            phone: invoiceData.buyer.phone || ''
          },
          supplier: {
            name: invoiceData.supplier.name,
            address: invoiceData.supplier.address || { street: '', country: 'AU' },
            phone: invoiceData.supplier.phone || '',
            email: invoiceData.supplier.email || ''
          },
          items: invoiceData.items.map(item => ({
            name: item.name,
            count: item.count,
            cost: item.cost,
            currency: item.currency || invoiceData.currency
          })),
          taxRate: invoiceData.taxRate || 10,
          total: invoiceData.total || calculateTotal(invoiceData.items, invoiceData.taxRate)
        }
      };

      // Make the API call
      const response = await apiClient.post(`${API_URL}/create`, requestData);
      
      // Handle successful response
      if (response.data && response.data.invoiceId) {
        // Add success message to chat
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: `Great! I've created invoice #${response.data.invoiceId} for you. The invoice has been successfully saved to your account.`,
            invoiceCreated: true,
            invoiceId: response.data.invoiceId
          }
        ]);
        
        // Reset invoice data and preview
        setInvoiceData(null);
        setShowInvoicePreview(false);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `I encountered an error while trying to create the invoice. You might want to try filling out the form manually.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate a unique invoice ID
  const generateInvoiceId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  // Helper function to calculate a default due date (30 days from issue date)
  const calculateDefaultDueDate = (issueDate) => {
    if (!issueDate) return '';
    const date = new Date(issueDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // Helper function to calculate total
  const calculateTotal = (items, taxRate = 10) => {
    const subtotal = items.reduce((sum, item) => sum + (item.cost * item.count), 0);
    const taxAmount = subtotal * (taxRate / 100);
    return subtotal + taxAmount;
  };

  const isInvoiceDataComplete = (data) => {
    // Simple check for required fields
    const requiredFields = [
      'buyer', 'supplier', 'items', 'issueDate', 'currency'
    ];
    
    return requiredFields.every(field => {
      if (field === 'items') {
        return data[field] && data[field].length > 0;
      }
      return data[field];
    });
  };

  const getMissingFields = (data) => {
    const requiredFields = [
      { key: 'buyer', label: 'buyer information' },
      { key: 'supplier', label: 'supplier information' },
      { key: 'items', label: 'invoice items' },
      { key: 'issueDate', label: 'issue date' },
      { key: 'currency', label: 'currency' }
    ];
    
    return requiredFields
      .filter(field => {
        if (field.key === 'items') {
          return !data[field.key] || data[field.key].length === 0;
        }
        return !data[field.key];
      })
      .map(field => field.label);
  };

  const renderMessage = (message, index) => {
    const isLastAIMessage = message.role === 'assistant' && index === messages.length - 1;
    
    return (
      <div 
        key={index} 
        className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
      >
        <div style={{ display: 'flex' }}>
          <div className="message-avatar">
            {message.role === 'user' ? (
              <div className="user-avatar">👤</div>
            ) : (
              <div className="assistant-avatar">🍣</div>
            )}
          </div>
          <div className="message-content">
            {message.image && (
              <div className="message-image">
                <img src={message.image} alt="Uploaded invoice" />
              </div>
            )}
            <p>{message.content}</p>
            
            {/* Show invoice preview with options when we have invoice data */}
            {isLastAIMessage && invoiceData && showInvoicePreview && (
              <div className="invoice-preview">
                <h4>Invoice Preview</h4>
                <div className="preview-content">
                  <div className="preview-row">
                    <span>Buyer:</span>
                    <span>{invoiceData.buyer?.name || 'Not specified'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Supplier:</span>
                    <span>{invoiceData.supplier?.name || 'Not specified'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Issue Date:</span>
                    <span>{invoiceData.issueDate || 'Not specified'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Items:</span>
                    <span>{invoiceData.items?.length || 0} items</span>
                  </div>
                  <div className="preview-row">
                    <span>Total:</span>
                    <span>{invoiceData.currency} {invoiceData.total || 0}</span>
                  </div>
                  
                  {isInvoiceDataComplete(invoiceData) ? (
                    <button 
                      className="create-invoice-button"
                      onClick={handleCreateInvoice}
                    >
                      Create Invoice
                    </button>
                  ) : (
                    <div className="invoice-action-buttons">
                      <button 
                        className="continue-chat-button"
                        onClick={() => {
                          setInput("Please help me complete the missing information");
                          setShowInvoicePreview(false);
                        }}
                      >
                        Continue Chat
                      </button>
                      <button 
                        className="prefill-form-button"
                        onClick={handleCreateInvoice}
                      >
                        Pre-fill Invoice Form
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Show created invoice message */}
            {message.invoiceCreated && (
              <div className="invoice-created-message">
                <div className="success-icon">✓</div>
                <p>Invoice #{message.invoiceId} has been created successfully!</p>
                <button 
                  className="view-invoice-button"
                  onClick={() => history.push(`/invoices/${message.invoiceId}`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View Invoice
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout activeSection="createInvoice">
      <div className="ai-chat-container">
        <div className="chat-header">
          <h2>
            <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🍣</span>
            Sushi AI Invoice Creator
          </h2>
          <p>Chat with our AI to create invoices easily</p>
        </div>
        
        <div className="chat-messages">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="chat-message assistant-message">
              <div style={{ display: 'flex' }}>
                <div className="message-avatar">
                  <div className="assistant-avatar">🍣</div>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
        
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="chat-input-container">
            <button 
              type="button" 
              className="upload-button"
              onClick={handleImageClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={handleInputChange} 
              placeholder="Describe the invoice you want to create..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !imageFile)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </form>
      </div>
    </AppLayout>
  );
};

export default AIInvoiceCreator;