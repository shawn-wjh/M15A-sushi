import axios from "axios";
import getCookie from "../../utils/cookieHelper";

const API_URL = "http://localhost:3000/v1/invoices";

export async function validateInvoices(invoiceIds) {
  const token = getCookie("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  console.log('token: ', token);
  try {
    const validationPromises = invoiceIds.map(async (invoiceId) => {
      const response = await axios.post(`${API_URL}/${invoiceId}/validate`, 
        { schemas: ['peppol', 'fairwork'] },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('response.data: ', response.data);
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
};

export async function validateInvoice(invoiceId) {
  return validateInvoices([invoiceId]);
};
