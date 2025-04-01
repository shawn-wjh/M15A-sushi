import React, { useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import "./Welcome.css";

const Welcome = () => {
  const history = useHistory();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // If user is logged in, redirect to dashboard
      history.push('/dashboard');
    }
  }, [history]);

  // Function to navigate to landing page when logo is clicked
  const goToLanding = () => {
    history.push('/');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <h1>
          Welcome to
        </h1>
        <h2 onClick={goToLanding} style={{ cursor: 'pointer' }}>
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
          <Link to="/" className="welcome-button">
            View App
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
