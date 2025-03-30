import React, { useEffect, useRef } from 'react';
import './XMLWindow.css';

const XMLWindow = ({ xml, onCopy, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Handle escape key press
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Handle click outside modal
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up event listeners
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="xml-modal-content" ref={modalRef}>
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
