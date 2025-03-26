import { useHistory } from "react-router-dom";
import axios from "axios";
import getCookie from "../../utils/cookieHelper";
import { useState, useEffect } from "react";
import "./InvoiceList.css";
import FilterPanel from "./FilterPanel";
import InvoiceListHeader from "./InvoiceListHeader";
import InvoiceListItem from "./InvoiceListItem";
import XMLWindow from "./XMLWindow";

const API_URL = "http://localhost:3000/v1/invoices/list";

const InvoiceList = () => {
  const history = useHistory();
  const [message, setMessage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showXmlPopup, setShowXmlPopup] = useState(false);
  const [selectedXml, setSelectedXml] = useState('');
  const [filters, setFilters] = useState({
    sort: "issuedate",
    order: "desc",
    limit: 10,
    offset: 0,
  });

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

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = getCookie("token");

      if (!token) {
        history.push("/login");
        return;
      }

      try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await axios.get(`${API_URL}?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setInvoices(response.data.data.invoices);
        setMessage(null);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        if (error.response?.status === 401) {
          history.push("/login");
        } else {
          setMessage({ type: "error", text: "Failed to fetch invoices" });
        }
      }
    };

    fetchInvoices();
  }, [filters, history]);

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

  const handleConfirmDelete = () => {
    // TODO: Implement actual delete functionality
    console.log("Delete selected invoices:", selectedInvoices);
    setShowDeleteConfirm(false);
    setSelectedInvoices(new Set());
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleDownloadSelected = () => {
    // TODO: Implement download functionality
    console.log("Download selected invoices:", selectedInvoices);
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
    setSelectedXml('');
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-navbar">
        <div className="dashboard-logo" onClick={() => history.push("/")}>
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </div>
        <div className="user-info">
          <button
            onClick={() => history.push("/dashboard")}
            className="logout-button"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="invoice-list-container">
          <div className="invoice-list-header">
            {message && <div className="error-message">{message.text}</div>}

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
                  <button
                    className="action-button cancel"
                    onClick={handleCancelSelection}
                  >
                    Cancel
                  </button>
                  <button
                    className="action-button delete"
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected
                  </button>
                  <button
                    className="action-button download"
                    onClick={handleDownloadSelected}
                  >
                    Download Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Confirmation</h3>
            <p>Are you sure you want to delete {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''}?</p>
            <div className="modal-buttons">
              <button className="modal-button cancel" onClick={handleCancelDelete}>
                No
              </button>
              <button className="modal-button delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showXmlPopup && (
        <XMLWindow
          xml={selectedXml}
          onCopy={handleCopyXml}
          onClose={handleCloseXml}
        />
      )}
    </div>
  );
};

export default InvoiceList;
