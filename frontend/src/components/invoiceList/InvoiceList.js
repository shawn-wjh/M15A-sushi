import { useHistory } from "react-router-dom";
import apiClient from "../../utils/axiosConfig";
import getCookie from "../../utils/cookieHelper";
import parseInvoiceXml from "../../utils/parseXmlHelper";
import { useState, useEffect } from "react";
import "./InvoiceList.css";
import FilterPanel from "./FilterPanel";
import InvoiceListHeader from "./InvoiceListHeader";
import InvoiceListItem from "./InvoiceListItem";
import ActionBarIcon from "./ActionBarIcon";
import InvoicePagination from "./InvoicePagination";
import ValidationSchemaPopUp from "../invoiceValidationResult/validationSchemaPopUp";
import ExportInvoicePopup from "../exportInvoice/ExportInvoicePopup";

const API_URL = "/v1/invoices/list";

const InvoiceList = ({ displaySharedInvoices = false }) => {
  const history = useHistory();
  const [message, setMessage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showXmlPopup, setShowXmlPopup] = useState(false);
  const [selectedXml, setSelectedXml] = useState("");
  const [filters, setFilters] = useState({
    sort: "issuedate",
    order: "desc",
    limit: 10,
  });
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isValidationPopUpOpen, setIsValidationPopUpOpen] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, filters, displaySharedInvoices]);

  const fetchInvoices = async () => {
    const token = getCookie("token");
    if (!token) {
      history.push("/login");
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        ...filters,
        offset: (currentPage - 1) * filters.limit,
      }).toString();

      let response;
      if (displaySharedInvoices) {
        response = await apiClient.get(`${API_URL}/shared?${queryParams}`);
      } else {
        response = await apiClient.get(`${API_URL}?${queryParams}`);
        console.log('response.data.data.invoices:', response.data.data.invoices);
      }

      // case where user is not logged in
      if (response.status === 401) {
        history.push("/login");
        return;
      }

      // case where user has no invoices
      if (
        !response.data.data.invoices ||
        response.data.data.invoices.length === 0
      ) {
        setInvoices([]);
        setTotalInvoices(0);
        setMessage({
          type: "info",
          text: displaySharedInvoices
            ? "No Shared Invoices"
            : "No Invoices Created Yet",
        });
        return;
      }

      // Parse XML data for each invoice
      const parsedInvoices = response.data.data.invoices.map((invoice) => {
        const parsedData = parseInvoiceXml(invoice.invoice);
        return {
          ...invoice,
          parsedData: parsedData,
        };
      });

      setInvoices(parsedInvoices);
      setTotalInvoices(response.data.data.count);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      if (error.response?.status === 401) {
        history.push("/login");
      } else if (error.response?.status === 400) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Invalid request. Please try again.",
        });
      } else {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to fetch invoices",
        });
      }
      setInvoices([]);
      setTotalInvoices(0);
    }
  };

  const toggleInvoice = (invoiceId) => {
    setExpandedInvoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(invoices.map((invoice) => invoice.InvoiceID));
      setSelectedInvoices(allIds);
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set(invoices.map((invoice) => invoice.InvoiceID));
    setExpandedInvoices(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedInvoices(new Set());
  };

  const handleDeleteSelected = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const token = getCookie("token");
    if (!token) {
      history.push("/login");
      return;
    }

    try {
      // Create an array of promises for all delete operations
      const deletePromises = Array.from(selectedInvoices).map((invoiceId) =>
        apiClient.delete(`/v1/invoices/${invoiceId}`)
      );

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      // Update the UI
      setShowDeleteConfirm(false);
      setSelectedInvoices(new Set());
      setExpandedInvoices(new Set()); // Also clear expanded state

      // Show success message
      setMessage({
        type: "success",
        text: `Successfully deleted ${selectedInvoices.size} invoice${selectedInvoices.size !== 1 ? "s" : ""}`,
      });

      // Force a refresh of the invoice list
      await fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoices:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete invoices",
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleDownloadSelected = () => {
    // TODO: Implement download functionality
    setShowDownloadPopup(true);
  };

  const handleCancelSelection = () => {
    setSelectedInvoices(new Set());
  };

  const handleViewXml = (invoice) => {
    setSelectedXml(invoice.invoice);
    setShowXmlPopup(true);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(selectedXml);
  };

  const handleCloseXml = () => {
    setShowXmlPopup(false);
    setSelectedXml("");
  };

  const handleValidateSelected = () => {
    // TODO: Implement validate functionality
    setIsValidationPopUpOpen(true);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedInvoices(new Set());
    setExpandedInvoices(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="dashboard-page">
      <div className="invoice-list-container">
        {message && <div className="error-message">{message.text}</div>}
        <div className="invoice-list-header">
          <FilterPanel
            isFilterPanelOpen={isFilterPanelOpen}
            setIsFilterPanelOpen={setIsFilterPanelOpen}
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleExpandAll={handleExpandAll}
            handleCollapseAll={handleCollapseAll}
          />
        </div>

        <InvoiceListHeader
          selectedInvoices={selectedInvoices}
          invoices={invoices}
          handleSelectAll={handleSelectAll}
        />

        <ul className="invoice-list">
          {invoices.map((invoice) => (
            <InvoiceListItem
              key={invoice.InvoiceID}
              invoice={invoice}
              isExpanded={expandedInvoices.has(invoice.InvoiceID)}
              isSelected={selectedInvoices.has(invoice.InvoiceID)}
              onSelect={handleSelectInvoice}
              onToggle={toggleInvoice}
              onViewXml={handleViewXml}
              formatDateTime={formatDateTime}
              formatDate={formatDate}
              displaySharedInvoices={displaySharedInvoices}
            />
          ))}
        </ul>

        {selectedInvoices.size > 0 && (
          <div className="action-bar">
            <div className="action-bar-content">
              <span className="selected-count">
                {selectedInvoices.size} item
                {selectedInvoices.size !== 1 ? "s" : ""} selected
              </span>
              <div className="action-buttons">
                <ActionBarIcon
                  onClick={handleCancelSelection}
                  title="Cancel Selection"
                  className="cancel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </ActionBarIcon>
                {!displaySharedInvoices && (
                  <>
                    <ActionBarIcon
                      onClick={handleValidateSelected}
                      title="Validate Selected"
                      className="validate"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </ActionBarIcon>
                    <ActionBarIcon
                      onClick={handleDeleteSelected}
                      title="Delete Selected"
                      className="delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
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
                    </ActionBarIcon>
                  </>
                )}
                <ActionBarIcon
                  onClick={handleDownloadSelected}
                  title="Download Selected"
                  className="download"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
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
                </ActionBarIcon>
              </div>
            </div>
          </div>
        )}

        <InvoicePagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalInvoices / filters.limit)}
          onPageChange={handlePageChange}
        />
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Confirmation</h3>
            <p>
              Are you sure you want to delete {selectedInvoices.size} invoice
              {selectedInvoices.size !== 1 ? "s" : ""}?
            </p>
            {message && <div className="error-message">{message.text}</div>}
            <div className="modal-buttons">
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

      {isValidationPopUpOpen && (
        <ValidationSchemaPopUp
          onClose={() => setIsValidationPopUpOpen(false)}
          invoiceIds={Array.from(selectedInvoices)}
        />
      )}

      {showDownloadPopup && (
        <ExportInvoicePopup
          onClose={() => setShowDownloadPopup(false)}
          invoiceId={Array.from(selectedInvoices)}
        />
      )}
    </div>
  );
};

export default InvoiceList;
