import React, { useState } from 'react';

const [settings, setSettings] = useState({
  apiKey: '',
  apiUrl: '',
  peppolId: '',
  sendEndpoint: '',
  statusEndpoint: '',
});

const handleSubmit = (event) => {
  event.preventDefault();
  // Handle form submission
};

const handleInputChange = (event) => {
  const { name, value } = event.target;
  setSettings((prevSettings) => ({
    ...prevSettings,
    [name]: value,
  }));
};

const handleDelete = () => {
  // Handle delete action
};

const isSaving = false;
const isDeleting = false;
const hasSettings = true;

return (
  <div className="settings-section">
    <h2>Peppol Settings</h2>
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="apiUrl">API URL</label>
        <input
          type="text"
          id="apiUrl"
          name="apiUrl"
          value={settings.apiUrl}
          onChange={handleInputChange}
          placeholder="e.g., https://api.peppol-provider.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="apiKey">API Key</label>
        <input
          type="password"
          id="apiKey"
          name="apiKey"
          value={settings.apiKey}
          onChange={handleInputChange}
          placeholder="Your Peppol API key"
        />
      </div>

      <div className="form-group">
        <label htmlFor="peppolId">Your Peppol ID</label>
        <input
          type="text"
          id="peppolId"
          name="peppolId"
          value={settings.peppolId}
          onChange={handleInputChange}
          placeholder="e.g., 0192:12345678901"
        />
      </div>

      <div className="form-group">
        <label htmlFor="sendEndpoint">Send Endpoint</label>
        <input
          type="text"
          id="sendEndpoint"
          name="sendEndpoint"
          value={settings.sendEndpoint}
          onChange={handleInputChange}
          placeholder="e.g., /api/v1/send or send"
        />
        <small>The endpoint path for sending invoices. Default: 'send'</small>
      </div>

      <div className="form-group">
        <label htmlFor="statusEndpoint">Status Endpoint</label>
        <input
          type="text"
          id="statusEndpoint"
          name="statusEndpoint"
          value={settings.statusEndpoint}
          onChange={handleInputChange}
          placeholder="e.g., /api/v1/status or status"
        />
        <small>The endpoint path for checking delivery status. Default: 'status'</small>
      </div>

      <div className="settings-actions">
        <button type="submit" className="save-button" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        {hasSettings && (
          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Settings'}
          </button>
        )}
      </div>
    </form>
  </div>
); 