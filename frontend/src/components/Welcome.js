import React from "react";
import { Link } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import "./Welcome.css";

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <h1>
          Welcome to
        </h1>
        <h2>
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </h2>
        <p>
          All your eInvoicing generation and validation needs met in one place
        </p>
        <div className="welcome-buttons">
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="welcome-button"
          >
            Documentation <FiExternalLink />
          </a>
          <Link to="/landing" className="welcome-button">
            View App
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
