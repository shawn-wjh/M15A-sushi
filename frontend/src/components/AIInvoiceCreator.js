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
  const [imagePreview, setImagePreview] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const history = useHistory();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up event listeners for paste events
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = items[i].getAsFile();
            handleImageUpload(file);
            break;
          }
        }
      }
    };

    // Add the event listener to the document
    document.addEventListener('paste', handlePaste);
    
    // Clean up
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleImageUpload = (file) => {
    if (file) {
      setImageFile(file);
      
      // Create preview for the input area
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleDeleteMessageImage = (messageIndex) => {
    setMessages(prev => {
      const updatedMessages = [...prev];
      // Create a new object without the image property
      const { image, ...messageWithoutImage } = updatedMessages[messageIndex];
      updatedMessages[messageIndex] = messageWithoutImage;
      return updatedMessages;
    });
    
    // Ensure file input is reset for future uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() && !imageFile) return;
    
    // Add user message to chat
    const userMessage = input.trim();
    
    // Store for later reference
    const currentImageFile = imageFile;
    const currentImagePreview = imagePreview;
    
    // Clear the image immediately to improve UX
    setImageFile(null);
    setImagePreview(null);
    
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (currentImageFile) {
      // Add message with image if there's an image file
      setMessages(prev => [
        ...prev,
        { 
          role: 'user', 
          content: userMessage || 'I\'m uploading an invoice image.', 
          image: currentImagePreview 
        }
      ]);
      
      // Process the image
      await processImageFile(currentImageFile, userMessage);
    } else {
      // Text-only message
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage }
      ]);
      
      // Process the text message
      await processTextMessage(userMessage);
    }
    
    // Clear input
    setInput('');
    
    // Reset textarea height
    if (e.target.querySelector('.chat-textarea')) {
      e.target.querySelector('.chat-textarea').style.height = 'auto';
    }
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
          const data = response.data.data;
          
          // Ensure payment fields exist
          const invoiceDataWithPayment = {
            ...data,
            paymentAccountId: data.paymentAccountId || '',
            paymentAccountName: data.paymentAccountName || '',
            financialInstitutionBranchId: data.financialInstitutionBranchId || ''
          };
          
          console.log("Processed invoice data with payment:", invoiceDataWithPayment);
          
          setInvoiceData(invoiceDataWithPayment);
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

  const processImageFile = async (file, text = '') => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
  
      // Only keep the bits of each message you actually need
      const conversationHistory = messages
        .slice(1)
        .map(({ image, ...keep }) => keep);
  
      formData.append('conversation', JSON.stringify(conversationHistory));
  
      if (text) {
        formData.append('text', text);
      }
      
      console.log("Sending image with conversation history:", conversationHistory.length, "messages");
      
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
          const data = response.data.data;
          
          // Ensure payment fields exist
          const invoiceDataWithPayment = {
            ...data,
            paymentAccountId: data.paymentAccountId || '',
            paymentAccountName: data.paymentAccountName || '',
            financialInstitutionBranchId: data.financialInstitutionBranchId || ''
          };
          
          console.log("Processed image invoice data with payment:", invoiceDataWithPayment);
          
          setInvoiceData(invoiceDataWithPayment);
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
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleCancelImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset file input value so it can be used again with the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    // Handle backspace key press when an image is in preview but no text
    if (e.key === 'Backspace' && imagePreview && !input.trim()) {
      e.preventDefault();
      handleCancelImage();
    }
  };

  const handleCreateInvoice = () => {
    if (invoiceData) {
      // Check if all required fields are present
      if (isInvoiceDataComplete(invoiceData)) {
        // Call API to directly create the invoice
        createInvoiceDirectly();
      } else {
        // Transform the data to match the structure expected by InvoiceForm
        const formData = {
          invoiceId: invoiceData.invoiceId || generateInvoiceId(),
          issueDate: invoiceData.issueDate || '',
          dueDate: invoiceData.dueDate || '',
          currency: invoiceData.currency || 'AUD',
          buyer: invoiceData.buyer?.name || '',
          supplier: invoiceData.supplier?.name || '',
          buyerAddress: invoiceData.buyer?.address || { street: '', country: 'AU' },
          supplierAddress: invoiceData.supplier?.address || { street: '', country: 'AU' },
          buyerPhone: invoiceData.buyer?.phone || '',
          supplierPhone: invoiceData.supplier?.phone || '',
          supplierEmail: invoiceData.supplier?.email || '',
          // Include payment information
          paymentAccountId: invoiceData.paymentAccountId || '',
          paymentAccountName: invoiceData.paymentAccountName || '',
          financialInstitutionBranchId: invoiceData.financialInstitutionBranchId || '',
          items: (invoiceData.items || []).map(item => ({
            name: item.name || '',
            count: parseFloat(item.count) || 1,
            cost: parseFloat(item.cost) || 0,
            currency: item.currency || invoiceData.currency || 'AUD'
          })),
          taxRate: invoiceData.taxRate || 10,
          total: invoiceData.total || 0
        };

        // Navigate to invoice form with pre-filled data for manual completion
        history.push({
          pathname: '/invoices/create',
          state: { orderData: formData }
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
        invoiceId: invoiceData.invoiceId || generateInvoiceId(),
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate || calculateDefaultDueDate(invoiceData.issueDate),
        currency: invoiceData.currency,
        // Use the direct string values for buyer and supplier names
        buyer: invoiceData.buyer.name,
        supplier: invoiceData.supplier.name,
        // Use separate fields for addresses and contact info
        buyerAddress: invoiceData.buyer.address || { street: '', country: 'AU' },
        supplierAddress: invoiceData.supplier.address || { street: '', country: 'AU' },
        buyerPhone: invoiceData.buyer.phone || '',
        supplierPhone: invoiceData.supplier.phone || '',
        supplierEmail: invoiceData.supplier.email || '',
        // Process payment information - ensure it's explicitly included
        paymentAccountId: invoiceData.paymentAccountId || '',
        paymentAccountName: invoiceData.paymentAccountName || '',
        financialInstitutionBranchId: invoiceData.financialInstitutionBranchId || '',
        // Include items array
        items: invoiceData.items.map(item => ({
          name: item.name,
          count: parseFloat(item.count),
          cost: parseFloat(item.cost),
          currency: item.currency || invoiceData.currency
        })),
        // Include tax information
        taxRate: invoiceData.taxRate || 10,
        total: invoiceData.total || calculateTotal(invoiceData.items, invoiceData.taxRate),
        taxTotal: (invoiceData.total || calculateTotal(invoiceData.items, invoiceData.taxRate)) * ((invoiceData.taxRate || 10) / 100)
      };

      console.log("Sending to API:", requestData);
      
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
    // Check if data exists
    if (!data) return false;

    // Check buyer and supplier required fields
    const hasBuyer = data.buyer && data.buyer.name;
    const hasSupplier = data.supplier && data.supplier.name;

    // Check other required fields
    const hasItems = data.items && data.items.length > 0;
    const hasIssueDate = !!data.issueDate;
    const hasCurrency = !!data.currency;

    return hasBuyer && hasSupplier && hasItems && hasIssueDate && hasCurrency;
  };

  const getMissingFields = (data) => {
    const requiredFields = [
      { key: 'buyer', label: 'buyer information' },
      { key: 'supplier', label: 'supplier information' },
      { key: 'items', label: 'invoice items' },
      { key: 'issueDate', label: 'issue date' },
      { key: 'currency', label: 'currency' }
    ];
    
    const missingRequired = requiredFields
      .filter(field => {
        if (field.key === 'items') {
          return !data[field.key] || data[field.key].length === 0;
        }
        return !data[field.key];
      })
      .map(field => field.label);
    
    // Check for payment information
    const hasPaymentInfo = data.paymentAccountId || data.paymentAccountName || data.financialInstitutionBranchId;
    
    return missingRequired.concat(
      !hasPaymentInfo ? ['payment information (recommended)'] : []
    );
  };

  const renderMessage = (message, index) => {
    const isLastAIMessage = message.role === 'assistant' && index === messages.length - 1;
    
    return (
      <div 
        key={index} 
        className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
      >
        <div className="message-container">
          <div className="message-avatar">
            {message.role === 'user' ? (
              <div className="user-avatar">👤</div>
            ) : (
              <div className="assistant-avatar">🍣</div>
            )}
          </div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">{message.role === 'user' ? 'You' : 'Sushi AI'}</span>
              <span className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {message.image && (
              <div className="message-image" style={{ 
                margin: '10px 0',
                maxWidth: '300px',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid #444'
              }}>
                <img 
                  src={message.image} 
                  alt="Uploaded invoice" 
                  style={{
                    width: '100%',
                    display: 'block'
                  }}
                />
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
                  
                  {/* Payment Information Section */}
                  <div className="preview-payment">
                    <h5>Payment Information</h5>
                    <div className="preview-row">
                      <span>Bank Account Number:</span>
                      <span>{invoiceData.paymentAccountId || 'Not specified'}</span>
                    </div>
                    <div className="preview-row">
                      <span>Account Name:</span>
                      <span>{invoiceData.paymentAccountName || 'Not specified'}</span>
                    </div>
                    <div className="preview-row">
                      <span>Branch Identifier:</span>
                      <span>{invoiceData.financialInstitutionBranchId || 'Not specified'}</span>
                    </div>
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
            <span className="logo-icon">🍣</span>
            Sushi AI Invoice Creator
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">Online</span>
            </div>
          </h2>
          <p>Chat with our AI to create invoices easily and efficiently</p>
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
        
        <form 
          className="chat-input-form" 
          onSubmit={handleSendMessage}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          ref={chatInputRef}
        >
          <div 
            className="chat-input-container"
            style={{
              backgroundColor: isDraggingOver ? 'rgba(70, 70, 70, 0.8)' : 'rgba(37, 37, 37, 0.6)',
              boxShadow: isDraggingOver ? '0 0 10px rgba(255, 59, 48, 0.5)' : undefined,
              transition: 'all 0.2s ease'
            }}
          >
            {imagePreview ? (
              <div className="image-preview-container" style={{ position: 'relative', marginRight: '10px' }}>
                <div className="image-preview" style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #444',
                  position: 'relative'
                }}>
                  <img 
                    src={imagePreview} 
                    alt="Upload preview" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleCancelImage}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    backgroundColor: '#ff3b30',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    zIndex: 100
                  }}
                >
                  ✖
                </button>
              </div>
            ) : (
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
            )}
            <textarea 
              value={input} 
              onChange={handleInputChange} 
              placeholder={isDraggingOver ? "Drop image here..." : imagePreview ? "Add a message with your image..." : "Describe the invoice you want to create or paste an image..."}
              disabled={isLoading}
              rows="1"
              className="chat-textarea"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                } else if (e.key === 'Backspace' && imagePreview && !input.trim()) {
                  e.preventDefault();
                  handleCancelImage();
                }
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !imageFile)}
              className={imagePreview ? "send-button-with-image" : ""}
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
          {isDraggingOver && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9,
              pointerEvents: 'none'
            }}>
              <div style={{
                padding: '20px 30px',
                backgroundColor: 'rgba(40, 40, 40, 0.9)',
                borderRadius: '8px',
                border: '2px dashed #ff3b30',
                color: 'white',
                fontWeight: 'bold'
              }}>
                Drop image here
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
};

export default AIInvoiceCreator;