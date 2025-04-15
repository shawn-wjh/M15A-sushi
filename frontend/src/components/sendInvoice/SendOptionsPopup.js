import React, { useState } from "react";
import "./SendOptionsPopup.css";
import { FaNetworkWired, FaEnvelope, FaFileInvoice } from "react-icons/fa";
import PeppolSendOption from "./PeppolSendOption";
import SushiSendOption from "./SushiSendOption";
import EmailSendOption from "./EmailSendOption";

const SendOptionsPopup = ({ onClose, invoiceId }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  if (selectedOption === "peppol") {
    return (
      <PeppolSendOption
        invoiceId={invoiceId}
        onClose={() => setSelectedOption(null)}
      />
    );
  }

  if (selectedOption === "email") {
    return (
      <EmailSendOption
        invoiceId={invoiceId}
        onClose={() => setSelectedOption(null)}
      />
    );
  }

  if (selectedOption === "sushi") {
    return (
      <SushiSendOption
        invoiceId={invoiceId}
        onClose={() => setSelectedOption(null)}
      />
    );
  }

  return (
    <div className="send-options-overlay" onClick={onClose}>
      <div
        className="send-options-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="send-options-title">Share with</h3>
        <div className="send-options-grid">
          <div
            className="send-option"
            onClick={() => handleOptionClick("peppol")}
          >
            <div className="send-option-icon">
              <img src={require("./peppolLogo.png")} alt="Peppol Network" />
            </div>
            <span className="send-option-label">Peppol Network</span>
          </div>
          <div
            className="send-option"
            onClick={() => handleOptionClick("email")}
          >
            <div className="send-option-icon">
              <FaEnvelope />
            </div>
            <span className="send-option-label">Email</span>
          </div>
          <div
            className="send-option"
            onClick={() => handleOptionClick("sushi")}
          >
            <div className="send-option-icon">
              <FaFileInvoice />
            </div>
            <span className="send-option-label">Sushi Invoice</span>
          </div>
        </div>
        <div className="send-options-buttons">
          <button className="send-options-button cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendOptionsPopup;
