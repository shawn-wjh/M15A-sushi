import React from "react";
import { useHistory } from "react-router-dom";
import { useState, useEffect } from "react";
import "./InvoiceList.css";
import { EyeIcon } from "./EyeIcon";
import { SendIcon } from "./SendIcon";
import { ValidateIcon } from "./ValidateIcon";
import ValidationSchemaPopUp from "../invoiceValidationResult/validationSchemaPopUp";
import apiClient from "../../utils/axiosConfig";

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
  const [peppolConfigured, setPeppolConfigured] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const history = useHistory();
  const parsedData = invoice.parsedData;
  const [isValidationPopUpOpen, setIsValidationPopUpOpen] = useState(false);

  // Check if Peppol is configured
  useEffect(() => {
    const checkPeppolSettings = async () => {
      try {
        const response = await apiClient.get('/v1/users/peppol-settings');
        setPeppolConfigured(response.data?.status === 'success' && response.data?.data?.isConfigured);
      } catch (error) {
        console.error('Failed to check Peppol settings:', error);
        setPeppolConfigured(false);
      }
    };
    checkPeppolSettings();
  }, []);

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

  const handleSend = (e) => {
    e.stopPropagation();
    if (!peppolConfigured) {
      history.push("/dashboard?tab=settings&settings=peppol");
    } else {
      setShowSendModal(true);
      setSendResult(null);
    }
  };

  const handleSendCancel = () => {
    setShowSendModal(false);
    setRecipientId('');
    setSendResult(null);
  };

  const handleSendConfirm = async () => {
    if (!recipientId) {
      setSendResult({
        status: 'error',
        message: 'Recipient ID is required'
      });
      return;
    }
    
    setIsSending(true);
    setSendResult(null);
    
    try {
      const response = await apiClient.post(`/v1/invoices/${invoice.InvoiceID}/send`, {
        recipientId: recipientId
      });
      
      if (response.data?.status === 'success') {
        setSendResult({
          status: 'success',
          message: 'Invoice sent successfully via Peppol network',
          deliveryId: response.data.deliveryId,
          timestamp: response.data.timestamp
        });
      } else {
        setSendResult({
          status: 'error',
          message: 'Failed to send invoice'
        });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      setSendResult({
        status: 'error',
        message: error.response?.data?.message || 'Failed to send invoice via Peppol'
      });
    } finally {
      setIsSending(false);
    }
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
              className="invoice-header-icon send"
              title={peppolConfigured ? "Send via Peppol" : "Configure Peppol Settings"}
              onClick={handleSend}
            >
              <SendIcon onClick={handleSend} />
            </div>
            <div
              className="invoice-header-icon view-details"
              title="View Invoice Details"
              onClick={handleViewInvoice}
            >
              <EyeIcon onClick={handleViewInvoice} />
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

      {showSendModal && (
        <div className="modal-overlay" onClick={handleSendCancel}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Send Invoice via Peppol</h3>
            <p>Enter the recipient's Peppol ID to send this invoice:</p>
            
            {sendResult && (
              <div className={`sending-result ${sendResult.status}`}>
                <p>{sendResult.message}</p>
                {sendResult.status === 'success' && sendResult.deliveryId && (
                  <div className="delivery-details">
                    <div className="detail-item">
                      <span className="detail-label">Delivery ID:</span>
                      <span className="detail-value">{sendResult.deliveryId}</span>
                    </div>
                    {sendResult.timestamp && (
                      <div className="detail-item">
                        <span className="detail-label">Timestamp:</span>
                        <span className="detail-value">{new Date(sendResult.timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="input-field">
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="e.g., 0192:12345678901"
                required
                disabled={isSending || (sendResult && sendResult.status === 'success')}
              />
              <small>The recipient must be registered on the Peppol network</small>
            </div>
            
            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={handleSendCancel}
              >
                Close
              </button>
              {(!sendResult || sendResult.status !== 'success') && (
                <button
                  className="send-peppol-button"
                  onClick={handleSendConfirm}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Invoice'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
