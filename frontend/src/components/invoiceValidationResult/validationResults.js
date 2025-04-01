import { useLocation } from "react-router-dom";
import axios from "axios";
import getCookie from "../../utils/cookieHelper";
import "./validationResults.css";

const API_URL = "http://localhost:3000/v2/invoices";

async function validateInvoices(invoiceIds, schemas) {
  const token = getCookie("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const validationPromises = invoiceIds.map(async (invoiceId) => {
      const response = await axios.post(
        `${API_URL}/${invoiceId}/validate`,
        { schemas: schemas },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("response.data: ", response.data);
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
  // get schemas and invoiceids from url
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // turn schema and invoiceids query into arrays
  const schemas = searchParams.get("schemas")?.split(" ") || [];
  const invoiceids = searchParams.get("invoiceids")?.split(" ") || [];

  // get validation results
  const validationResults = validateInvoices(invoiceids, schemas);
  console.log("validationResults: ", validationResults);

  return (
    <div>
      <h1>made it to validation result page!! Still under construction</h1>
    </div>
  );
};

export default ValidationResult;
