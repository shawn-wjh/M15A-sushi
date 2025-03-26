import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(false);
    } catch (e) {
      console.error('Failed to parse user data');
      history.push('/login');
    }
  }, [history]);

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    // Clear auth cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    // Redirect to login
    history.push('/login');
  };

  const handleCreateInvoice = () => {
    history.push('/invoice/create');
  };

  const handleViewInvoices = () => {
    history.push('/invoices/list');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-navbar">
        <div className="dashboard-logo" onClick={() => history.push('/')}>
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user.name || user.email}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-banner">
            <h2>Welcome back, {user.name || user.email}!</h2>
            <p>Manage your invoices with ease. Create new invoices, view your existing ones, and keep track of your billing information all in one place.</p>
          </div>
          
          <div className="action-card">
            <h3>Your Profile</h3>
            <div className="action-items">
              <div className="action-item">
                <div className="action-content">
                  <div className="action-title">Name</div>
                  <div className="action-description">{user.name || 'Not provided'}</div>
                </div>
              </div>
              
              <div className="action-item">
                <div className="action-content">
                  <div className="action-title">Email</div>
                  <div className="action-description">{user.email}</div>
                </div>
              </div>
              
              <div className="action-item">
                <div className="action-content">
                  <div className="action-title">Role</div>
                  <div className="action-description">{user.role || 'Standard User'}</div>
                </div>
              </div>
              
              <div className="action-item">
                <div className="action-content">
                  <div className="action-title">Account ID</div>
                  <div className="action-description">{user.UserID || user.userId || user._id || 'Not available'}</div>
                </div>
              </div>
              
              {user.createdAt && (
                <div className="action-item">
                  <div className="action-content">
                    <div className="action-title">Member Since</div>
                    <div className="action-description">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="action-card">
            <h3>Quick Actions</h3>
            <div className="action-items">
              <div className="action-item" onClick={handleCreateInvoice}>
                <div className="action-icon">+</div>
                <div className="action-content">
                  <div className="action-title">Create New Invoice</div>
                  <div className="action-description">Generate a new invoice for your clients</div>
                </div>
              </div>
              
              <div className="action-item" onClick={handleViewInvoices}>
                <div className="action-icon">📋</div>
                <div className="action-content">
                  <div className="action-title">View Invoices</div>
                  <div className="action-description">See all your created invoices</div>
                </div>
              </div>
              
              <div className="action-item" onClick={() => history.push('/settings')}>
                <div className="action-icon">⚙️</div>
                <div className="action-content">
                  <div className="action-title">Account Settings</div>
                  <div className="action-description">Update your profile information</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 