import { FaFileCode, FaFilePdf, FaFileCsv } from "react-icons/fa";
import { useState } from "react";
import apiClient from "../../utils/axiosConfig";

const API_URL = "/v1/export";

const ExportInvoicePopup = ({ onClose, invoiceId }) => {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!Array.isArray(invoiceId)) {
    invoiceId = [invoiceId];
  }

  const handleXMLExport = async () => {
    console.log("invoiceId in exportInvoicePopup", invoiceId);
    for (const id of invoiceId) {
      try {
        const response = await apiClient.get(`${API_URL}/${id}/xml`, {
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${invoiceId}.xml`);
        document.body.appendChild(link);

        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess(true);
        setMessage("XML file downloaded successfully");
      } catch (error) {
        setError("Failed to download XML file");
        console.error("Error downloading XML:", error);
      }
    }
  };

  const handlePDFExport = async () => {
    for (const id of invoiceId) {
      try {
        console.log("exportPDF called");
        const response = await apiClient.get(`${API_URL}/${id}/pdf`, {
          responseType: "blob",
        });
        console.log("response", response);

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${invoiceId}.pdf`);
        document.body.appendChild(link);

        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess(true);
        setMessage("PDF file downloaded successfully");
      } catch (error) {
        setError("Failed to download PDF file");
        console.error("Error downloading PDF:", error);
      }
    }
  };

  const handleCSVExport = async () => {
    for (const id of invoiceId) {
      try {
        console.log("exportCSV called");
        const response = await apiClient.get(`${API_URL}/${id}/csv`, {
          responseType: "blob",
        });
        console.log("response", response);

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${id}.csv`);
        document.body.appendChild(link);

        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess(true);
        setMessage("CSV file downloaded successfully");
      } catch (error) {
        setError("Failed to download CSV file");
        console.error("Error downloading CSV:", error);
      }
    }
  };

  return (
    <div className="send-options-overlay" onClick={onClose}>
      {success || message ? (
        <div
          className="modal-content email-send-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`validation-success-icon ${success ? "valid" : "invalid"}`}
          >
            {success ? "✓" : "✕"}
          </div>
          <h3>{message}</h3>
          {success && <p>The invoice has been exported successfully.</p>}
        </div>
      ) : (
        <div
          className="send-options-content"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="send-options-title">Export Invoice</h3>
          <div className="send-options-grid">
            <div className="send-option" onClick={handleXMLExport}>
              <div className="send-option-icon">
                <FaFileCode />
              </div>
              <span className="send-option-label">XML</span>
            </div>
            <div className="send-option" onClick={handlePDFExport}>
              <div className="send-option-icon">
                <FaFilePdf />
              </div>
              <span className="send-option-label">PDF</span>
            </div>
            <div className="send-option" onClick={handleCSVExport}>
              <div className="send-option-icon">
                <FaFileCsv />
              </div>
              <span className="send-option-label">CSV</span>
            </div>
          </div>
          <div className="send-options-buttons">
            <button className="send-options-button cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportInvoicePopup;
