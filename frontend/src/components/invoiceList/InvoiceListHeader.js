import React from 'react';
import './InvoiceList.css';

const InvoiceListHeader = ({ 
  selectedInvoices, 
  invoices, 
  handleSelectAll 
}) => {
  return (
    <div className="invoice-list-header-row">
      <div className="invoice-checkbox-container">
        <input
          type="checkbox"
          className="invoice-checkbox"
          checked={selectedInvoices.size === invoices.length}
          onChange={handleSelectAll}
        />
      </div>
      <div className="invoice-main-info">
        <span className="invoice-column-header">Buyer</span>
        <span className="invoice-column-header">Supplier</span>
        <span className="invoice-column-header">Status</span>
        <span className="invoice-dates">Last Modified</span>
      </div>
    </div>
  );
};

export default InvoiceListHeader;
