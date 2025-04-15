import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import AppLayout from './AppLayout';
import './XMLInvoiceUpload.css';

const XMLInvoiceUpload = () => {
  const [xmlData, setXmlData] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const history = useHistory();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setXmlData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      // Use the correct endpoint for single XML invoice upload
      const response = await apiClient.post('/v1/invoices/upload-single-xml', {
        xmlInvoice: xmlData
      });

      setMessage({
        type: 'success',
        text: 'Invoice uploaded successfully'
      });
      setXmlData('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload XML invoice');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout activeSection="createInvoice">
      <div className="xml-invoice-upload-container">
        <div className="xml-upload-header">
          <h2>Upload XML Invoice</h2>
          <p>Upload a single XML invoice file</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="upload-area">
            <label htmlFor="xml-file" className="file-input-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Choose XML File
              <input
                type="file"
                id="xml-file"
                accept=".xml"
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
            
            {xmlData && (
              <div className="preview-area">
                <h3>XML Preview</h3>
                <pre className="xml-preview">{xmlData}</pre>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className={`upload-button ${isUploading ? 'uploading' : ''}`}
            disabled={!xmlData || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Invoice'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.type}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            {message.text}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="back-button-container">
          <button 
            className="back-button" 
            onClick={() => history.push('/invoices/create-selection')}
          >
            Back to Invoice Options
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default XMLInvoiceUpload; 