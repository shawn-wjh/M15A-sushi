import React from 'react';
import './InvoiceList.css';

const XMLWindow = ({ xml, onCopy, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="xml-modal-content">
        <div className="xml-modal-header">
          <h3>Invoice XML</h3>
          <div className="xml-modal-actions">
            <button 
              className="xml-modal-button copy"
              onClick={onCopy}
              title="Copy to clipboard"
            >
              📋
            </button>
            <button 
              className="xml-modal-button close"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="xml-content">
          <pre>{xml}</pre>
        </div>
      </div>
    </div>
  );
};

export default XMLWindow;
