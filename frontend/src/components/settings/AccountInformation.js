import apiClient from "../../utils/axiosConfig";
import { useState, useEffect } from "react";
import { setCookie } from "../../utils/cookieHelper";

const API_URL = "v1/users";

export const AccountInformation = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [originalUser, setOriginalUser] = useState(null);

  // Initialize state when user prop changes
  useEffect(() => {
    if (user) {
      setOriginalUser(user);
      setEmail(user.email || "");
      setName(user.name || "");
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    // Reset to original values
    if (originalUser) {
      setEmail(originalUser.email || "");
      setName(originalUser.name || "");
    }
  };

  const handleUpdateDetails = async () => {
    try {
      setMessage(""); // Clear any previous messages

      // Only include fields that have changed and are not empty
      const updateData = {};
      
      if (name && name !== originalUser.name) {
        updateData.name = name;
      }
      
      if (email && email !== originalUser.email) {
        updateData.email = email;
      }
      
      if (password) {
        if (password !== confirmPassword) {
          setMessage("Passwords do not match");
          return;
        }
        updateData.password = password;
      }

      // Only make the request if there are changes
      if (Object.keys(updateData).length === 0) {
        setMessage("No changes to update");
        return;
      }

      const response = await apiClient.post(`${API_URL}/update-details`, updateData);

      if (response.status === 200) {
        setIsEditing(false);
        setMessage("Details updated successfully");
        setPassword("");
        setConfirmPassword("");
        
        // Update the auth token if one was returned
        if (response.data.token) {
          setCookie('token', response.data.token);
        }

        // Update local storage with new user
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          // Notify parent component of user update
          if (onUserUpdate) {
            onUserUpdate(response.data.user);
          }
        }
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage(error.response?.data?.error || "Failed to update details");
    }
  };

  return (
    <>
      <div className="settings-placeholder">
        <div className="settings-option">
          <h3>Personal Information</h3>
          <p>Update your personal details and contact information</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              placeholder="Enter your full name"
              disabled={!isEditing}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              placeholder="Enter your email"
              disabled={!isEditing}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="company">Company Name</label>
            <input
              type="text"
              id="company"
              defaultValue=""
              placeholder="Enter your company name"
              disabled={!isEditing}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "Enter your new password" : "********"}
              disabled={!isEditing}
            />
          </div>
          {isEditing && (
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {message && (
            <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          {isEditing ? (
            <>
              <button
                className="btn btn-secondary"
                style={{ marginTop: "15px", marginRight: "10px" }}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ marginTop: "15px" }}
                onClick={handleUpdateDetails}
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              style={{ marginTop: "15px" }}
              onClick={handleEdit}
            >
              Edit
            </button>
          )}
        </div>

        <div className="settings-option">
          <h3>Business Information</h3>
          <p>Update your business details for invoicing</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="business-id">Business ID</label>
            <input
              type="text"
              id="business-id"
              placeholder="Enter your business ID"
            />
          </div>
          <div className="form-field">
            <label htmlFor="tax-id">Tax ID / VAT Number</label>
            <input type="text" id="tax-id" placeholder="Enter your tax ID" />
          </div>
          <div className="form-field">
            <label htmlFor="address">Business Address</label>
            <textarea
              id="address"
              rows="3"
              placeholder="Enter your business address"
            ></textarea>
          </div>
          <button className="btn btn-primary" style={{ marginTop: "15px" }}>
            Save Changes
          </button>
        </div>

        <div className="settings-option">
          <h3>Subscription</h3>
          <p>Manage your subscription and billing details</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="plan">Current Plan: Omakase</label>
            <ul>
              <li>Unlimited invoices</li>
              <li>Full feature set</li>
              <li>Priority support</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: "15px" }}>
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountInformation;
