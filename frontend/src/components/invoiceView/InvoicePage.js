import { useHistory, useLocation } from "react-router-dom";
import apiClient from "../../utils/axiosConfig";
import { useState, useEffect } from "react";
import getCookie from "../../utils/cookieHelper";
import "./InvoicePage.css";
import XMLWindow from "./XMLWindow";
import parseInvoiceXml from "../../utils/parseXmlHelper";
import ValidationSchemaPopUp from "../invoiceValidationResult/validationSchemaPopUp";
import AppLayout from "../AppLayout";
import SendOptionsPopup from "../sendInvoice/SendOptionsPopup";
import ExportInvoicePopup from "../exportInvoice/ExportInvoicePopup";
const API_URL = "/v1/invoices";

const InvoicePage = () => {
  const history = useHistory();
  const location = useLocation();
  const fromShared = location.state?.fromShared || false;
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [message, setMessage] = useState(null);
  const [showXmlWindow, setShowXmlWindow] = useState(false);
  const [rawXml, setRawXml] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isValidationPopUpOpen, setIsValidationPopUpOpen] = useState(false);

  // Peppol related state
  const [peppolConfigured, setPeppolConfigured] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showExportInvoicePopup, setShowExportInvoicePopup] = useState(false);

  useEffect(() => {
    const getInvoice = async () => {
      const token = getCookie("token");

      // direct to login page if not logged in
      if (!token) {
        history.push("/login");
        return;
      }

      const invoiceId = window.location.pathname.split("/").pop();
      setInvoiceId(invoiceId);

      if (!invoiceId) {
        setMessage({ type: "error", text: "Invalid invoice ID" });
        return;
      }

      try {
        console.log("invoiceId in invoice page", invoiceId);
        const response = await apiClient.get(`${API_URL}/${invoiceId}`);

        // Extract invoice information from XML
        const invoiceData = parseInvoiceXml(response.data);

        setInvoice(invoiceData);
        setRawXml(response.data);
        setMessage(null);

        // Check if Peppol is configured
        checkPeppolSettings();
      } catch (error) {
        if (error.response?.status === 401) {
          history.push("/login");
        } else {
          setMessage({ type: "error", text: "Failed to fetch invoice" });
        }
      }
    };

    getInvoice();
  }, [history]);

  // Function to check if Peppol is configured
  const checkPeppolSettings = async () => {
    try {
      const response = await apiClient.get("/v1/users/peppol-settings");

      if (
        response.data?.status === "success" &&
        response.data?.data?.isConfigured
      ) {
        setPeppolConfigured(true);
      } else {
        setPeppolConfigured(false);
      }
    } catch (error) {
      console.error("Failed to check Peppol settings:", error);
      setPeppolConfigured(false);
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // View features /////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  const handleViewXml = () => {
    setShowXmlWindow(true);
  };

  const handleCopyXml = async () => {
    try {
      await navigator.clipboard.writeText(rawXml);
      setMessage({ type: "success", text: "XML copied to clipboard" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to copy XML" });
    }
  };

  const handleCloseXml = () => {
    setShowXmlWindow(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const token = getCookie("token");
    if (!token) {
      history.push("/login");
      return;
    }

    const invoiceId = window.location.pathname.split("/").pop();

    if (!invoiceId) {
      setMessage({ type: "error", text: "Invalid invoice ID" });
      return;
    }

    try {
      await apiClient.delete(`${API_URL}/${invoiceId}`);

      // // Show success message
      // setMessage({ type: "success", text: "Invoice successfully deleted" });

      // Redirect to invoice list
      history.push("/dashboard", { section: "invoices" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete invoice",
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleDownload = () => {
    setShowExportInvoicePopup(true);
  };

  const handleValidate = () => {
    setIsValidationPopUpOpen(true);
  };

  const handleEdit = () => {
    // Redirect to InvoiceForm with the invoice data
    history.push({
      pathname: `/invoices/edit/${invoiceId}`,
      state: { invoice: invoice },
    });
  };

  // Peppol send functions
  const handleSend = (e) => {
    e.stopPropagation();
    setShowSendModal(true);
    setSendResult(null);
  };

  const handleSendCancel = () => {
    setShowSendModal(false);
    setRecipientId("");
    setSendResult(null);
  };

  const handleSendConfirm = async () => {
    if (!recipientId) {
      setSendResult({
        status: "error",
        message: "Recipient ID is required",
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await apiClient.post(`${API_URL}/${invoiceId}/send`, {
        recipientId: recipientId,
      });

      if (response.data?.status === "success") {
        setSendResult({
          status: "success",
          message: "Invoice sent successfully via Peppol network",
          deliveryId: response.data.deliveryId,
          timestamp: response.data.timestamp,
        });
      } else {
        setSendResult({
          status: "error",
          message: "Failed to send invoice",
        });
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      setSendResult({
        status: "error",
        message:
          error.response?.data?.message || "Failed to send invoice via Peppol",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!invoice) {
    return (
      <AppLayout activeSection={fromShared ? "shared-invoices" : "invoices"}>
        <div className="invoice-view-container">
          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeSection={fromShared ? "shared-invoices" : "invoices"}>
      {isValidationPopUpOpen && (
        <ValidationSchemaPopUp
          onClose={() => setIsValidationPopUpOpen(false)}
          invoiceIds={[invoiceId]}
        />
      )}
      <div className="invoice-view-container">
        <button
          className="back-button"
          onClick={() =>
            history.push({
              pathname: "/dashboard",
              state: { section: fromShared ? "shared-invoices" : "invoices" },
            })
          }
          title="Back to Invoice List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Invoice List</span>
        </button>

        <div className="welcome-banner">
          <div className="banner-header">
            <div>
              <h2>Invoice Details</h2>
              <p>Viewing invoice {invoice.invoiceId}</p>
            </div>
            <div className="banner-actions">
              <button
                className="action-button validate"
                onClick={handleValidate}
                title="Validate Invoice"
                disabled={fromShared}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </button>
              <button
                className="action-button"
                onClick={handleViewXml}
                title="View XML"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
              <button
                className="action-button"
                onClick={handleEdit}
                title="Edit Invoice"
                disabled={fromShared}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                className="action-button"
                onClick={handleSend}
                title={
                  peppolConfigured
                    ? "Send via Peppol"
                    : "Configure Peppol Settings"
                }
                disabled={fromShared}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
              <button
                className="action-button"
                onClick={handleDownload}
                title="Download Invoice"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button
                className="action-button delete"
                onClick={handleDelete}
                title="Delete Invoice"
                disabled={fromShared}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Confirmation</h3>
              <p>Are you sure you want to delete this invoice?</p>
              <div className="modal-buttons">
                {message && <div className="error-message">{message.text}</div>}
                <button
                  className="modal-button cancel"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="modal-button delete"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showSendModal && (
          <SendOptionsPopup
            onClose={handleSendCancel}
            invoiceId={invoice.InvoiceID}
          />
        )}

        {showExportInvoicePopup && (
          <ExportInvoicePopup
            onClose={() => setShowExportInvoicePopup(false)}
            invoiceId={invoiceId}
          />
        )}

        {showXmlWindow && (
          <XMLWindow
            xml={rawXml}
            onCopy={handleCopyXml}
            onClose={handleCloseXml}
          />
        )}

        <div className="invoice-form">
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Invoice ID</label>
                <div className="form-value">{invoice.invoiceId}</div>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <div className="form-value">{invoice.currency}</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Issue Date</label>
                <div className="form-value">{invoice.issueDate}</div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <div className="form-value">{invoice.dueDate}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Buyer Information</h3>

            <div className="form-group">
              <label>Buyer Name</label>
              <div className="form-value">{invoice.buyer.name}</div>
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <div className="form-value">{invoice.buyer.address.street}</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <div className="form-value">
                  {invoice.buyer.address.country}
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="form-value">{invoice.buyer.phone}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Supplier Information</h3>

            <div className="form-group">
              <label>Supplier Name</label>
              <div className="form-value">{invoice.supplier.name}</div>
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <div className="form-value">
                {invoice.supplier.address.street}
              </div>
            </div>

            <div className="form-group">
              <label>Country</label>
              <div className="form-value">
                {invoice.supplier.address.country}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplierPhone">
                  Phone Number <span className="required-note">*</span>
                </label>
                <div className="form-value">{invoice.supplier.phone}</div>
              </div>

              <div className="form-group">
                <label htmlFor="supplierEmail">
                  Email Address <span className="required-note">*</span>
                </label>
                <div className="form-value">{invoice.supplier.email}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Invoice Items</h3>

            {invoice.items.map((item, index) => (
              <div key={index} className="item-container">
                <div className="item-header">
                  <h4>Item {index + 1}</h4>
                </div>

                <div className="form-group">
                  <label>Item Name</label>
                  <div className="form-value">{item.name}</div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <div className="form-value">{item.count}</div>
                  </div>

                  <div className="form-group">
                    <label>Unit Price</label>
                    <div className="form-value">{item.cost}</div>
                  </div>

                  <div className="form-group">
                    <label>Currency</label>
                    <div className="form-value">{item.currency}</div>
                  </div>
                </div>

                <div className="item-total">
                  Item Total: {item.currency}{" "}
                  {(parseFloat(item.count) * parseFloat(item.cost)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Tax Information</h3>
            <div className="tax-configuration">
              <div className="form-group">
                <label htmlFor="taxRate">
                  Tax Rate (%) <span className="required-indicator">*</span>
                </label>
                <div className="tax-rate-input">
                  <div className="form-value">{invoice.taxRate}</div>
                  <span className="tax-rate-symbol">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Payment Information</h3>
            <div className="form-group">
              <label htmlFor="paymentAccountId">Bank Account Number</label>
              <div className="form-value">{invoice.paymentAccountId}</div>
            </div>

            <div className="form-group">
              <label htmlFor="paymentAccountId">Account Name</label>
              <div className="form-value">{invoice.paymentAccountName}</div>
            </div>

            <div className="form-group">
              <label htmlFor="financialInstitutionBranchId">
                Branch Identifier
              </label>
              <div className="form-value">
                {invoice.financialInstitutionBranchId}
              </div>
            </div>
          </div>

          <div className="form-section totals-section">
            <h3>Invoice Summary</h3>
            <div className="invoice-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">
                  {invoice.currency} {parseFloat(invoice.total).toFixed(2)}
                </span>
              </div>

              <div className="summary-row tax-row">
                <div className="tax-rate-display">
                  <span className="summary-label">
                    Tax ({invoice.taxRate === "" ? "0" : invoice.taxRate}%):
                  </span>
                </div>
                <span className="summary-value">
                  {invoice.currency} {parseFloat(invoice.taxTotal).toFixed(2)}
                </span>
              </div>

              <div className="summary-row total-row">
                <span className="summary-label">Total (inc. tax):</span>
                <span className="summary-value total">
                  {invoice.currency}{" "}
                  {(
                    parseFloat(invoice.total) + parseFloat(invoice.taxTotal)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoicePage;
