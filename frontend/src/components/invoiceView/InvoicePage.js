import { useHistory } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";
import getCookie from "../../utils/cookieHelper";
import "./InvoicePage.css";
import XMLWindow from "../invoiceList/XMLWindow";

const API_URL = "http://localhost:3000/v1/invoices";

const InvoicePage = () => {
  const history = useHistory();
  const [invoice, setInvoice] = useState(null);
  const [message, setMessage] = useState(null);
  const [showXmlWindow, setShowXmlWindow] = useState(false);
  const [rawXml, setRawXml] = useState(null);

  useEffect(() => {
    const getInvoice = async () => {
      const token = getCookie("token");

      // direct to login page if not logged in
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
        const response = await axios.get(`${API_URL}/${invoiceId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        // Store the raw XML
        setRawXml(response.data);
        console.log('response.data: ', response.data);

        // Parse the XML string from the response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        console.log('xmlDoc: ', xmlDoc);

        // Extract invoice information from XML
        const invoiceData = {
          invoiceId: xmlDoc.querySelectorAll("cbc\\:ID, ID")[2]?.textContent || "N/A",
          issueDate: xmlDoc.querySelector("cbc\\:IssueDate, IssueDate")?.textContent || "N/A",
          dueDate: xmlDoc.querySelector("cbc\\:DueDate, DueDate")?.textContent || "N/A",
          currency: xmlDoc.querySelector("cbc\\:DocumentCurrencyCode, DocumentCurrencyCode")?.textContent || "AUD",
          total: xmlDoc.querySelector("cac\\:LegalMonetaryTotal cbc\\:PayableAmount, LegalMonetaryTotal PayableAmount")?.textContent || "0.00",
          buyer: {
            name: xmlDoc.querySelector("cac\\:AccountingCustomerParty cac\\:Party cac\\:PartyName cbc\\:Name, AccountingCustomerParty Party PartyName Name")?.textContent || "N/A",
            address: {
              street: xmlDoc.querySelector("cac\\:AccountingCustomerParty cac\\:Party cac\\:PostalAddress cbc\\:StreetName, AccountingCustomerParty Party PostalAddress StreetName")?.textContent || "N/A",
              country: xmlDoc.querySelector("cac\\:AccountingCustomerParty cac\\:Party cac\\:PostalAddress cac\\:Country cbc\\:IdentificationCode, AccountingCustomerParty Party PostalAddress Country IdentificationCode")?.textContent || "AUS"
            },
            phone: xmlDoc.querySelector("cac\\:AccountingCustomerParty cac\\:Party cac\\:Contact cbc\\:Telephone, AccountingCustomerParty Party Contact Telephone")?.textContent || "N/A"
          },
          supplier: {
            name: xmlDoc.querySelector("cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyName cbc\\:Name, AccountingSupplierParty Party PartyName Name")?.textContent || "N/A",
            address: {
              street: xmlDoc.querySelector("cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:StreetName, AccountingSupplierParty Party PostalAddress StreetName")?.textContent || "N/A",
              country: xmlDoc.querySelector("cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cac\\:Country cbc\\:IdentificationCode, AccountingSupplierParty Party PostalAddress Country IdentificationCode")?.textContent || "AUS"
            }
          },
          items: Array.from(xmlDoc.querySelectorAll("cac\\:InvoiceLine, InvoiceLine")).map(line => ({
            name: line.querySelector("cac\\:Item cbc\\:Name, Item Name")?.textContent || "N/A",
            count: line.querySelector("cbc\\:BaseQuantity, BaseQuantity")?.textContent || "1",
            cost: line.querySelector("cac\\:Price cbc\\:PriceAmount, Price PriceAmount")?.textContent || "0.00",
            currency: line.querySelector("cac\\:Price cbc\\:PriceAmount, Price PriceAmount")?.getAttribute("currencyID") || "AUD"
          }))
        };

        setInvoice(invoiceData);
        setMessage(null);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        if (error.response?.status === 401) {
          history.push("/login");
        } else {
          setMessage({ type: "error", text: "Failed to fetch invoice" });
        }
      }
    };
    
    getInvoice();
  }, [history]);

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
    // TODO: Implement delete functionality
    console.log("Delete invoice");
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit invoice");
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download invoice");
  };

  if (!invoice) {
    return (
      <div className="dashboard-page">
        <nav className="dashboard-navbar">
          <div className="dashboard-logo" onClick={() => history.push("/")}>
            <span className="logo-text">Sushi</span>
            <span className="logo-dot">.</span>
            <span className="logo-invoice">Invoice</span>
          </div>
          <div className="user-info">
            <button onClick={() => history.push("/dashboard")} className="logout-button">
              Back to Dashboard
            </button>
          </div>
        </nav>
        <main className="dashboard-main">
          <div className="invoice-view-container">
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-navbar">
        <div className="dashboard-logo" onClick={() => history.push("/")}>
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </div>
        <div className="user-info">
          <button onClick={() => history.push("/dashboard")} className="logout-button">
            Back to Dashboard
          </button>
        </div>
      </nav>
      
      <main className="dashboard-main">
        <div className="invoice-view-container">
          <button 
            className="back-button"
            onClick={() => history.goBack()}
            title="Back to Invoice List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
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
                  onClick={() => console.log("Validate invoice")}
                  title="Validate Invoice"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </button>
                <button 
                  className="action-button view-xml"
                  onClick={handleViewXml}
                  title="View XML"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
                <button 
                  className="action-button edit"
                  onClick={handleEdit}
                  title="Edit Invoice"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  className="action-button download"
                  onClick={handleDownload}
                  title="Download Invoice"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button 
                  className="action-button delete"
                  onClick={handleDelete}
                  title="Delete Invoice"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

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
                  <div className="form-value">{invoice.buyer.address.country}</div>
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
                <div className="form-value">{invoice.supplier.address.street}</div>
              </div>
              
              <div className="form-group">
                <label>Country</label>
                <div className="form-value">{invoice.supplier.address.country}</div>
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
                      <div className="form-value">{item.currency} {item.cost}</div>
                    </div>
                    
                    <div className="form-group">
                      <label>Currency</label>
                      <div className="form-value">{item.currency}</div>
                    </div>
                  </div>
                  
                  <div className="item-total">
                    Item Total: {item.currency} {(parseFloat(item.count) * parseFloat(item.cost)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="invoice-total">
              <span className="total-label">Invoice Total:</span>
              <span className="total-value">{invoice.currency} {parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoicePage;
