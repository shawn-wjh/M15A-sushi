import React from 'react';
import { useHistory } from 'react-router-dom';
import './InvoiceSelectionPage.css';
import AppLayout from './AppLayout';

const InvoiceSelectionPage = () => {
  const history = useHistory();

  const handleOrderSelection = () => {
    // Navigate to the invoice form with order creation option
    history.push('/invoices/create-from-order');
  };

  const handleXmlUploadSelection = () => {
    // Navigate directly to the single XML upload page
    history.push('/invoices/upload-xml-single');
  };

  return (
    <AppLayout activeSection="createInvoice">
      <div className="invoice-selection-container">
        <div className="selection-header">
          <h2>Create Invoice</h2>
          <p>Select a method to create your invoice</p>
        </div>

        <div className="selection-options">
          {/* Create Invoice from Order Option */}
          <div className="selection-card" onClick={handleOrderSelection}>
            <div className="selection-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="selection-content">
              <h3>Create Invoice from Order</h3>
              <p>Generate an invoice by using existing order data</p>
            </div>
            <div className="selection-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>

          {/* Upload XML Option */}
          <div className="selection-card" onClick={handleXmlUploadSelection}>
            <div className="selection-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="selection-content">
              <h3>Upload XML</h3>
              <p>Import invoice data from XML files</p>
            </div>
            <div className="selection-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceSelectionPage; 