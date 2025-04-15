import React from 'react';
import { useHistory } from 'react-router-dom';
import AppLayout from './AppLayout';
import './XmlUploadSelectionPage.css';

const XmlUploadSelectionPage = () => {
  const history = useHistory();

  const handleSingleXmlUpload = () => {
    // Navigate directly to the XML invoice upload page
    history.push('/invoices/upload-xml-single');
  };

  const handleDatasetUpload = () => {
    // Navigate directly to the XML dataset upload page
    history.push('/invoices/upload-xml-dataset');
  };

  return (
    <AppLayout activeSection="createInvoice">
      <div className="xml-upload-selection-container">
        <div className="selection-header">
          <h2>Upload XML</h2>
          <p>Select the type of XML upload</p>
        </div>

        <div className="selection-options">
          {/* Single XML Upload Option */}
          <div className="selection-card" onClick={handleSingleXmlUpload}>
            <div className="selection-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <polygon points="12 18 8 14 10 14 10 10 14 10 14 14 16 14"/>
              </svg>
            </div>
            <div className="selection-content">
              <h3>Upload Single XML Invoice</h3>
              <p>Upload an individual XML invoice</p>
            </div>
            <div className="selection-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>

          {/* Dataset Upload Option */}
          <div className="selection-card" onClick={handleDatasetUpload}>
            <div className="selection-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
                <rect x="3" y="17" width="18" height="2"/>
                <rect x="3" y="12" width="18" height="2"/>
                <rect x="3" y="7" width="18" height="2"/>
              </svg>
            </div>
            <div className="selection-content">
              <h3>Upload XML Dataset</h3>
              <p>Upload a dataset containing multiple invoices</p>
            </div>
            <div className="selection-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="back-button-container">
          <button 
            className="back-button" 
            onClick={() => history.push('/invoices/create-selection')}
          >
            Back to Selection
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default XmlUploadSelectionPage; 