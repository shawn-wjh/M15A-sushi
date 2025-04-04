import React from "react";
import { useHistory } from "react-router-dom";
import { useState } from "react";
import "./InvoiceList.css";
import { PopOutIcon } from "./PopOutIcon";
import { ValidateIcon } from "./ValidateIcon";
import ValidationSchemaPopUp from "../invoiceValidationResult/validationSchemaPopUp";

const InvoiceListItem = ({
  invoice,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
  onViewXml,
  formatDateTime,
  formatDate,
}) => {
  const [validationResult, setValidationResults] = useState(null);
  const history = useHistory();
  const parsedData = invoice.parsedData;
  const [isValidationPopUpOpen, setIsValidationPopUpOpen] = useState(false);

  const handleHeaderClick = (e) => {
    if (
      e.target.closest(".invoice-header-arrow") ||
      e.target.closest(".invoice-header-icon") ||
      e.target.closest(".invoice-checkbox-container")
    ) {
      return;
    }
    onToggle(invoice.InvoiceID);
  };

  const handleArrowClick = (e) => {
    e.stopPropagation();
    onToggle(invoice.InvoiceID);
  };

  const handleViewInvoice = (e) => {
    e.stopPropagation();
    history.push(`/invoices/${invoice.InvoiceID}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleValidate = async (e) => {
    // open validation schema pop up
    setIsValidationPopUpOpen(true);
  };

  return (
    <>
      <li className="invoice-item" onClick={(e) => handleHeaderClick(e)}>
        <div className="invoice-header">
          <div className="invoice-checkbox-container">
            <input
              type="checkbox"
              className="invoice-checkbox"
              checked={isSelected}
              onChange={() => onSelect(invoice.InvoiceID)}
            />
          </div>
          <div className="invoice-header-content">
            <div className="invoice-main-info">
              <span className="invoice-buyer">
                {parsedData?.buyer?.name || "Unknown"}
              </span>
              <span className="invoice-supplier">
                {parsedData?.supplier?.name || "Unknown"}
              </span>
              <span
                className={`invoice-status ${invoice.valid ? "status-valid" : "status-invalid"}`}
              >
                {invoice.valid ? "Valid" : "Invalid"}
              </span>
              <span className="invoice-dates">
                {formatDateTime(invoice.timestamp)}
              </span>
            </div>
          </div>
          <div className="invoice-header-actions">
            {!invoice.valid && (
              <div
                className="invoice-header-icon validate"
                title="Validate Invoice"
                onClick={handleValidate}
              >
                <ValidateIcon onClick={handleValidate} />
              </div>
            )}
            <div
              className="invoice-header-icon view-details"
              title="View Invoice Details"
              onClick={handleViewInvoice}
            >
              <PopOutIcon onClick={handleViewInvoice} />
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
                <span className="list-detail-label">Issue Date</span>
                <span className="detail-value">
                  {parsedData?.issueDate || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="list-detail-label">Due Date</span>
                <span className="detail-value">
                  {parsedData?.dueDate || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="list-detail-label">Total Amount</span>
                <span className="detail-value">
                  {parsedData?.currency} {parsedData?.total || "0.00"}
                </span>
              </div>
              <div className="detail-item">
                <span className="list-detail-label">Buyer Address</span>
                <span className="detail-value">
                  {parsedData?.buyer?.address?.street || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="list-detail-label">Buyer Phone</span>
                <span className="detail-value">
                  {parsedData?.buyer?.phone || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="list-detail-label">Items</span>
                <span className="detail-value">
                  {parsedData?.items?.length || 0} items
                </span>
              </div>
            </div>
          </div>
        )}
      </li>
      {isValidationPopUpOpen && (
        <ValidationSchemaPopUp
          onClose={() => setIsValidationPopUpOpen(false)}
          invoiceIds={[invoice.InvoiceID]}
        />
      )}
    </>
  );
};

export default InvoiceListItem;
