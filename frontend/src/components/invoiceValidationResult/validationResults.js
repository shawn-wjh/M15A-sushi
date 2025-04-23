import { useLocation, useHistory } from "react-router-dom";
import apiClient from "../../utils/axiosConfig";
import { getCookie } from "../../utils/cookieHelper";
import "./validationResults.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import AppLayout from "../AppLayout";
import parseInvoiceXml from "../../utils/parseXmlHelper";

const API_URL = "/v2/invoices";

export const schemaNameMap = {
  "peppol": "PEPPOL A-NZ",
  "fairwork": "Fair Work Commision",
  "BIS30": "PEPPOL BIS 3.0",
  "ATO": "ATO"
}

async function validateInvoices(invoiceIds, schemas, handleEdit) {
  const token = getCookie("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    console.log("in validateInvoices, invoiceIds: ", invoiceIds);
    const validationPromises = invoiceIds.map(async (invoiceId) => {
      console.log("in validateInvoices, invoiceId: ", invoiceId);
      console.log("in validateInvoices, schemas: ", schemas);
      const response = await apiClient.post(
        `${API_URL}/${invoiceId}/validate`,
        { schemas: schemas }
      );

      console.log("in validateInvoices, response: ", response);
      return {
        invoiceId,
        validationResult: response.data.validationResult,
      };
    });

    const results = await Promise.all(validationPromises);
    return results;
  } catch (error) {
    console.error("Error validating invoices:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed");
    }
    throw new Error(
      error.response?.data?.message || "Failed to validate invoices"
    );
  }
}

const ValidationResult = () => {
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasValidated, setHasValidated] = useState(false);

  const { schemas, invoiceids } = useMemo(() => {
    console.log("useMemo running with search:", location.search);
    return {
      schemas: searchParams.get("schemas")?.split(" ") || [],
      invoiceids: searchParams.get("invoiceids")?.split(" ") || []
    };
  }, [location.search]);

  const fetchValidationResults = useCallback(async () => {
    console.log("fetchValidationResults called with:", { invoiceids, schemas });
    try {
      setLoading(true);
      const results = await validateInvoices(invoiceids, schemas);
      console.log("validationResults set with: ", results);
      setValidationResults(results);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching validation results:", err);
    } finally {
      setLoading(false);
    }
  }, [invoiceids, schemas]);

  useEffect(() => {
    if (!hasValidated) {
      console.log("useEffect running");
      fetchValidationResults();
      setHasValidated(true);
    }
  }, [fetchValidationResults, hasValidated]);

  const handleEditInvoice = async (invoiceId) => {
    const response = await apiClient.get(`v1/invoices/${invoiceId}`);
    console.log("handleEditInvoice response: ", response);
    const parsedResponse = parseInvoiceXml(response.data);
    console.log("handleEditInvoice parsedResponse: ", parsedResponse);
    history.push({
      pathname: `/invoices/edit/${invoiceId}`, 
      state: { invoice: parsedResponse }
    });
  };

  if (error) {
    return (
      <div className="validation-container">
        <div className="validation-error-icon">✕</div>
        <h3>Error Validating Invoices</h3>
        <p>{error}</p>
      </div>
    );
  }

  const allValid = validationResults?.every(
    (result) => result.validationResult.valid
  );

  return (
    <AppLayout activeSection="invoices">
      <div className="validation-container">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className={`validation-success-icon ${allValid ? "valid" : "invalid"}`}>
              {allValid ? "✓" : "✕"}
            </div>
            <h3>
              {validationResults.length > 1 && allValid ? "All Invoices Validated Successfully!" :
              validationResults.length === 1 && allValid ? "Invoice Validated Successfully!" :
              validationResults.length > 1 && !allValid ? "Some Invoices Failed Validation" :
              validationResults.length === 1 && !allValid ? "Invoice Failed Validation" :
              "Invoice Failed Validation"}
            </h3>
            <p>
              Validation was performed against the following schemas:
              <ul className="validation-schema-list">
                {schemas.map((schema) => (
                  <li key={schema}>{schemaNameMap[schema]}</li>
                ))}
              </ul>
            </p>

            <div className="validation-invoice-details">
              <h4>Invoice Validation Results</h4>
              <div className="validation-invoice-list">
                {validationResults?.map((result) => (
                  <div key={result.invoiceId} className="validation-invoice-item">
                    <div className="validation-invoice-info">
                      <span className="validation-invoice-id">
                        Invoice ID: {result.invoiceId}
                      </span>
                      <span
                        className={`validation-status ${
                          result.validationResult.valid ? "success" : "failed"
                        }`}
                      >
                        {result.validationResult.valid ? "Valid" : "Invalid"}
                      </span>
                      <button
                        className="validation-edit-button"
                        onClick={() => handleEditInvoice(result.invoiceId)}
                        title="Edit Invoice"
                      >
                        <FaEdit />
                      </button>
                    </div>
                    {!result.validationResult.valid && result.validationResult.errors && (
                      <div className="validation-errors">
                        <h5>Errors:</h5>
                        <ul>
                          {result.validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.validationResult.warnings && result.validationResult.warnings.length > 0 && (
                      <div className="validation-warnings">
                        <h5>Warnings:</h5>
                        <ul>
                          {result.validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="validation-form-actions">
              <button
                className="validation-form-button primary"
                onClick={() => {
                  history.goBack();
                  if (history.location.pathname === '/dashboard') {
                    history.push('/invoices');
                  }
                }}
                title="Back to Invoice List"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ValidationResult;
