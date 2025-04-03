import apiClient from "../../utils/axiosConfig";
import { useState, useEffect } from "react";

const InvoicePageUpdateActions = ({ invoiceId, invoiceData, onCancel }) => {
    const [updateStatus, setUpdateStatus] = useState(null);

    useEffect(() => {
        const updateInvoice = async () => {
            if (!invoiceId) {
                throw new Error("Update failed: Invoice ID missing");
            }
            if (!invoiceData) {
                throw new Error("Update failed: Invoice data missing");
            }
        
            const endpoint = `/v2/invoices/${invoiceId}/update`;
            const response = await apiClient.put(endpoint, invoiceData);
            
            if (response.status === 200) {
                setUpdateStatus("success");
            } else {
                setUpdateStatus("error");
            }
        }
        updateInvoice();
    }, [invoiceId, invoiceData]);

    const handleUpdate = () => {
        // TODO: Implement update functionality
    }

    const handleCancel = () => {
        onCancel();
    }

    return (
        <div className="banner-actions">
            <button className="action-button delete" onClick={handleCancel} title="Cancel">Cancel</button>
            <button className="action-button validate" onClick={handleUpdate} title="Update Invoice">Update</button>
        </div>
    )
}

export default InvoicePageUpdateActions;


