import React from 'react';
import './InvoiceList.css';
import { PopOutIcon } from './PopOutIcon';

const InvoiceListItem = ({
  invoice,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
  onViewXml,
  formatDateTime,
  formatDate
}) => {
  const handleHeaderClick = (e) => {
    if (e.target.closest(".invoice-header-arrow")) {
      return;
    }
    onToggle(invoice.InvoiceID);
  };

  const handleArrowClick = (e) => {
    e.stopPropagation();
    onToggle(invoice.InvoiceID);
  };

  return (
    <li className="invoice-item">
      <div className="invoice-header">
        <div className="invoice-checkbox-container">
          <input
            type="checkbox"
            className="invoice-checkbox"
            checked={isSelected}
            onChange={() => onSelect(invoice.InvoiceID)}
          />
        </div>
        <div
          className="invoice-header-content"
          onClick={(e) => handleHeaderClick(e)}
        >
          <div className="invoice-main-info">
            <span className="invoice-buyer">
              {invoice.buyerName || "unkown"}
            </span>
            <span className="invoice-supplier">
              {invoice.supplierName || "unkown"}
            </span>
            <span
              className={`invoice-status ${invoice.valid ? "status-valid" : "status-invalid"}`}
            >
              {invoice.valid ? "Valid" : "Invalid"}
            </span>
          </div>
          <div className="invoice-dates">
            <span>{formatDateTime(invoice.timestamp)}</span>
          </div>
        </div>
        <div className="invoice-header-actions">
          <div
            className="invoice-header-icon view-details"
            title="View XML"
            onClick={() => onViewXml(invoice)}
          >
            <PopOutIcon />
          </div>
          <div
            className={`invoice-header-arrow ${isExpanded ? "expanded" : ""}`}
            onClick={(e) => handleArrowClick(e)}
          >
            ▼
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="invoice-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Issue Date</span>
              <span className="detail-value">
                {formatDate(invoice.timestamp)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Due Date</span>
              <span className="detail-value">
                {formatDate(invoice.dueDate)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value">
                ${invoice.total || "0.00"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Currency</span>
              <span className="detail-value">
                {invoice.currency || "USD"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Customer Email</span>
              <span className="detail-value">
                {invoice.customerEmail || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Customer Phone</span>
              <span className="detail-value">
                {invoice.customerPhone || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default InvoiceListItem;