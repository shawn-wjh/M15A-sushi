import apiClient from "../../utils/axiosConfig";
import { useState, useEffect } from "react";

const InvoicePageUpdateActions = ({ invoiceId, invoiceData, onCancel }) => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [errorPopup, setErrorPopup] = useState(false);

  // debugging
  useEffect(() => {
    console.log("InvoicePageUpdateActions received props:", { invoiceId, invoiceData });
  }, [invoiceId, invoiceData]);
  
  const handleUpdate = async () => {
    console.log("handleUpdate function called");
    try {
      setIsUpdating(true);
      setError(null);
      
      if (!invoiceId) {
        throw new Error("Update failed: Invoice ID missing");
      }
      console.log("invoiceData to update with: ", invoiceData);
      if (!invoiceData) {
        throw new Error("Update failed: Invoice data missing");
      }

      // Ensure all numeric values are properly formatted
      const formattedData = {
        ...invoiceData,
        total: parseFloat(invoiceData.total) || 0,
        taxTotal: parseFloat(invoiceData.taxTotal) || 0,
        taxRate: parseFloat(invoiceData.taxRate) || 0,
        items: invoiceData.items.map(item => ({
          ...item,
          count: parseFloat(item.count) || 0,
          cost: parseFloat(item.cost) || 0
        }))
      };

      console.log("Formatted data for update:", formattedData);

      const endpoint = `/v2/invoices/${invoiceId}/update`;
      const response = await apiClient.put(endpoint, formattedData);
      console.log("Update response:", response);

      if (response.status === 200) {
        setUpdateStatus("success");
        // Reload the page to show updated data
        window.location.reload();
      } else {
        setUpdateStatus("error");
        setError("Failed to update invoice: " + (response.data?.error || "Unknown error"));
      }
    } catch (err) {
      console.log("Error caught in handleUpdate: ", err);
      setUpdateStatus("error");
      setError(err.message || "An error occurred while updating the invoice");
      setErrorPopup(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleCloseErrorMessagePopup = () => {
    setErrorPopup(false);
    setError(null);
  };

  return (
    <>
      {error && (
        <ErrorMessagePopup
          errorMessage={error}
          onClose={handleCloseErrorMessagePopup}
        />
      )}
      <div className="banner-actions">
        <button
          className="action-button delete"
          onClick={handleCancel}
          title="Cancel"
          disabled={isUpdating}
        >
          Cancel
        </button>
        <button
          className="action-button validate"
          onClick={handleUpdate}
          title="Update Invoice"
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </>
  );
};

const ErrorMessagePopup = ({ errorMessage, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Error</h3>
        <div className="error-message">{errorMessage}</div>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePageUpdateActions;
