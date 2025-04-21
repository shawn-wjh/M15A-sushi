import React, { useState, useEffect } from "react";
import apiClient from "../utils/axiosConfig";
import "./PeppolSettings.css";

const PeppolSettings = () => {
  const [settings, setSettings] = useState({
    isConfigured: false,
    apiKey: "",
    apiUrl: "",
    peppolId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch current Peppol settings when component mounts
  useEffect(() => {
    fetchPeppolSettings();
  }, []);

  const fetchPeppolSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/v1/users/peppol-settings");

      if (response.data && response.data.status === "success") {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch Peppol settings:", error);
      setMessage({
        text: "Failed to load Peppol settings. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!settings.apiKey || !settings.apiUrl) {
      setMessage({
        text: "API Key and API URL are required.",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const response = await apiClient.post("/v1/users/peppol-settings", {
        peppolApiKey: settings.apiKey,
        peppolApiUrl: settings.apiUrl,
        peppolId: settings.peppolId,
      });

      if (response.data && response.data.status === "success") {
        setMessage({
          text: "Peppol settings saved successfully!",
          type: "success",
        });
        fetchPeppolSettings(); // Refresh settings
      }
    } catch (error) {
      console.error("Failed to save Peppol settings:", error);
      setMessage({
        text:
          error.response?.data?.message ||
          "Failed to save settings. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSettings = async () => {
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const response = await apiClient.delete("/v1/users/peppol-settings");

      if (response.data && response.data.status === "success") {
        setMessage({
          text: "Peppol settings removed successfully!",
          type: "success",
        });
        setSettings({
          isConfigured: false,
          apiKey: "",
          apiUrl: "",
          peppolId: "",
        });
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error("Failed to delete Peppol settings:", error);
      setMessage({
        text:
          error.response?.data?.message ||
          "Failed to remove settings. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Peppol settings...</div>;
  }

  return (
    <>
      <div className="peppol-info-card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          {/* Optional: Add an icon here */}
          <h4>About Peppol</h4>
        </div>
        <div className="card-body">
          <p className="info-intro">
            Peppol is a global network simplifying electronic document exchange
            (like e-invoices) between businesses and governments.
          </p>
          <h5>Key Benefits:</h5>
          <ul className="benefits-list">
            <li>
              <span className="list-icon">✓</span> Send invoices directly to
              customer accounting systems.
            </li>
            <li>
              <span className="list-icon">✓</span> Comply easily with global
              e-invoicing regulations.
            </li>
            <li>
              <span className="list-icon">✓</span> Reduce manual data entry,
              errors, and processing time.
            </li>
            <li>
              <span className="list-icon">✓</span> Accelerate payment cycles and
              improve cash flow.
            </li>
          </ul>

          <div className="getting-started">
            <h5>How to get started:</h5>
            <ol className="steps-list">
              <li>Sign up with a certified Peppol Access Point provider.</li>
              <li>
                Obtain your unique Peppol ID and API credentials from them.
              </li>
              <li>
                Enter the API Key, API URL, and optional Peppol ID in the form
                on the left.
              </li>
              <li>Save the settings to activate the Peppol integration.</li>
            </ol>
          </div>
        </div>
        <div className="card-footer">
          <a
            href="https://peppol.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="learn-more-link"
          >
            Learn more about Peppol →
          </a>
        </div>
      </div>
      <div className="peppol-settings-container">
        <div className="peppol-settings-form-card">
          <div className="card-header">
            <h3>Peppol Network Integration</h3>
            <p className="peppol-description">
              Connect your Peppol Access Point to send e-invoices directly to
              your customers via the Peppol network.
            </p>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div className="form-field">
              <label htmlFor="apiKey">Peppol API Key</label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={settings.apiKey}
                onChange={handleInputChange}
                placeholder="Enter your Peppol Access Point API key"
                required
              />
              <small>Get this from your Peppol Access Point provider</small>
            </div>

            <div className="form-field">
              <label htmlFor="apiUrl">Peppol API URL</label>
              <input
                type="text"
                id="apiUrl"
                name="apiUrl"
                value={settings.apiUrl}
                onChange={handleInputChange}
                placeholder="e.g., https://api.youraccesspoint.com/v1"
                required
              />
              <small>The base URL for your Access Point's API</small>
            </div>

            <div className="form-field">
              <label htmlFor="peppolId">Your Peppol ID (Optional)</label>
              <input
                type="text"
                id="peppolId"
                name="peppolId"
                value={settings.peppolId || ""}
                onChange={handleInputChange}
                placeholder="e.g., 0192:123456789"
              />
              <small>Your Peppol participant ID (if available)</small>
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>

              {settings.isConfigured && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowConfirmation(true)}
                  disabled={saving}
                >
                  Remove Connection
                </button>
              )}
            </div>
          </form>

          {showConfirmation && (
            <div className="confirmation-dialog-backdrop">
              <div className="confirmation-dialog">
                <div className="confirmation-header">
                  <h4>Remove Peppol Connection?</h4>
                </div>
                <div className="confirmation-body">
                  <p>
                    This will delete your saved Peppol API credentials. You
                    won't be able to send invoices via Peppol until you
                    reconfigure.
                  </p>
                </div>
                <div className="confirmation-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmation(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteSettings}
                    disabled={saving}
                  >
                    {saving ? "Removing..." : "Confirm Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PeppolSettings;
