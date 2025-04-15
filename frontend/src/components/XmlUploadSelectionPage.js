import React from 'react';
import { useHistory } from 'react-router-dom';
import AppLayout from './AppLayout';
import './XmlUploadSelectionPage.css';
import XMLDatasetUpload from './XMLDatasetUpload';

const XmlUploadSelectionPage = () => {
  const history = useHistory();

  return (
    <AppLayout activeSection="createInvoice">
      <div className="xml-upload-selection-container">
        <div className="selection-header">
          <h2>Upload XML</h2>
          <p>Upload an XML dataset containing multiple invoices</p>
        </div>

        {/* Dataset XML Upload Section - direct embedding */}
        <div className="xml-upload-section">
          <XMLDatasetUpload />
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