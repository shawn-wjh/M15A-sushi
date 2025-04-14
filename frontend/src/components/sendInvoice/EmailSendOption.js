import React, { useState, useRef } from "react";
import { FaEnvelope, FaTimes } from "react-icons/fa";
import "./SushiSendOption.css";
import apiClient from "../../utils/axiosConfig";

const EmailSendOption = ({ onClose, invoiceId }) => {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const email = inputValue.trim();

      if (email && validateEmail(email)) {
        if (!emails.includes(email)) {
          setEmails([...emails, email]);
          setInputValue("");
          setError("");
        } else {
          setError("Email already added");
        }
      } else if (email) {
        setError("Please enter a valid email address");
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      // Remove last email when backspace is pressed on empty input
      setEmails(emails.slice(0, -1));
    }
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      setError("Please add at least one email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      console.log("invoiceId in email send option: ", invoiceId);
      const response = await apiClient.post(`/v1/invoices/${invoiceId}/email`, {
        recipients: emails,
      });

      if (response.status === 200) {
        setSuccess(true);
        setMessage("Invoice shared successfully");
      } else {
        setMessage("Failed to share invoice, please try again");
        setError(response.data.error);
      }
    } catch (error) {
      setMessage("Failed to share invoice, please try again");
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {!message ? (
        <div
          className="modal-content email-send-content"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="loading-container">
              <div>
                <span className="loader"></span>
              </div>
              <p className="loading-text">sending...</p>
            </div>
          ) : (
            <>
              <h3>Share via Email</h3>
              <p>Enter recipients email addresses</p>

              <div className="email-input-container">
                <div className="email-tags">
                  {emails.map((email, index) => (
                    <div key={index} className="email-tag">
                      <FaEnvelope className="email-tag-icon" />
                      <span>{email}</span>
                      <button
                        className="email-tag-remove"
                        onClick={() => removeEmail(email)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      emails.length === 0 ? "Enter email addresses..." : ""
                    }
                    className="email-input"
                  />
                </div>
                <small>Recipients must be registered in Sushi*</small>
                {error && <div className="email-error">{error}</div>}
              </div>

              <div className="modal-buttons">
                <button className="modal-button cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="send-email-button"
                  onClick={handleSend}
                  disabled={emails.length === 0}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
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
          {success ? (
            <>
              <p>
                The invoice has been shared with the following email addresses:
              </p>
              <div className="email-tags success">
                {emails.map((email, index) => (
                  <div key={index} className="email-tag success">
                    <span>{email}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSendOption;
