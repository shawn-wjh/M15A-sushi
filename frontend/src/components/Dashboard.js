import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './Dashboard.css';
// Import icons - assuming we'll use Font Awesome or similar
// If not available, we'll need to add the package
import InvoiceForm from './InvoiceForm';
import InvoiceList from './invoiceList/InvoiceList';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(location.state?.section || 'overview');
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

  // Update activeSection when location state changes
  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state]);

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    // Clear auth cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    // Redirect to login
    history.push('/login');
  };

  const handleCreateInvoice = () => {
    // Set active section to create invoice instead of redirecting
    setActiveSection('createInvoice');
  };

  const handleViewInvoices = () => {
    // Set active section to invoices instead of redirecting
    setActiveSection('invoices');
  };

  const renderActiveSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'overview':
        return renderOverviewSection();
      case 'invoices':
        return renderInvoiceListSection();
      case 'createInvoice':
        return renderCreateInvoiceSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderOverviewSection();
    }
  };

  // New method to render the Create Invoice section
  const renderCreateInvoiceSection = () => {
    return (
      <div className="create-invoice-section">
        <h2>Create Invoice</h2>
        <InvoiceForm />
      </div>
    );
  };

  // New method to render the Invoice List section
  const renderInvoiceListSection = () => {
    return (
      <div className="invoice-list-section">
        <InvoiceList />
      </div>
    );
  };

  const renderProfileSection = () => {
    return (
      <div className="profile-section">
        <h2>Profile Information</h2>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </div>
            <div className="profile-name">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="profile-detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user?.email}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{user?.name || 'Not provided'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">User ID</div>
              <div className="detail-value">{user?.UserID || user?.userId || user?._id || 'Not available'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Account Type</div>
              <div className="detail-value">{user?.role || 'Standard User'}</div>
            </div>
            
            {user?.createdAt && (
              <div className="profile-detail-item">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewSection = () => {
    return (
      <div className="overview-section">
        <h2>Dashboard Overview</h2>
        
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon invoice-icon"></div>
            <div className="stat-content">
              <div className="stat-value">24</div>
              <div className="stat-label">Total Invoices</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon paid-icon"></div>
            <div className="stat-content">
              <div className="stat-value">18</div>
              <div className="stat-label">Paid Invoices</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending-icon"></div>
            <div className="stat-content">
              <div className="stat-value">6</div>
              <div className="stat-label">Pending Invoices</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon revenue-icon"></div>
            <div className="stat-content">
              <div className="stat-value">$3,240</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
        
        <div className="charts-container">
          <div className="chart-card">
            <h3>Monthly Invoice Trend</h3>
            <div className="chart-placeholder">
              <div className="chart-bars">
                <div className="chart-bar" style={{ height: '60%' }}></div>
                <div className="chart-bar" style={{ height: '80%' }}></div>
                <div className="chart-bar" style={{ height: '45%' }}></div>
                <div className="chart-bar" style={{ height: '70%' }}></div>
                <div className="chart-bar" style={{ height: '90%' }}></div>
                <div className="chart-bar" style={{ height: '75%' }}></div>
              </div>
              <div className="chart-labels">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
          
          <div className="chart-card">
            <h3>Invoice Status</h3>
            <div className="chart-placeholder">
              <div className="pie-chart">
                <div className="pie-slice paid"></div>
                <div className="pie-slice pending"></div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="color-indicator paid"></div>
                  <span>Paid (75%)</span>
                </div>
                <div className="legend-item">
                  <div className="color-indicator pending"></div>
                  <span>Pending (25%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon created"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1234 Created</div>
                <div className="activity-time">Today, 2:30 PM</div>
              </div>
              <div className="activity-amount">$850.00</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon paid"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1233 Paid</div>
                <div className="activity-time">Yesterday, 11:15 AM</div>
              </div>
              <div className="activity-amount">$1,240.00</div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon sent"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1232 Sent</div>
                <div className="activity-time">Jun 14, 2023</div>
              </div>
              <div className="activity-amount">$650.00</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsSection = () => {
    return (
      <div className="settings-section">
        <h2>Account Settings</h2>
        <p>Settings functionality will be implemented soon.</p>
        
        <div className="settings-placeholder">
          <div className="settings-option">
            <h3>Personal Information</h3>
            <p>Update your personal details and contact information</p>
          </div>
          
          <div className="settings-option">
            <h3>Password & Security</h3>
            <p>Manage your password and security preferences</p>
          </div>
          
          <div className="settings-option">
            <h3>Notifications</h3>
            <p>Configure your notification preferences</p>
          </div>
          
          <div className="settings-option">
            <h3>Billing & Payments</h3>
            <p>Manage your subscription and payment methods</p>
          </div>
        </div>
      </div>
    );
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="dashboard-logo">
            <span className="logo-text">Sushi</span>
            <span className="logo-dot">.</span>
            <span className="logo-invoice">Invoice</span>
          </div>
        </div>
        
        <div className="create-invoice-button-container">
          <button className="create-invoice-button" onClick={handleCreateInvoice}>
            <span className="plus-icon">+</span>
            Create Invoice
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={activeSection === 'profile' ? 'active' : ''} 
              onClick={() => setActiveSection('profile')}
            >
              <div className="nav-icon profile-icon"></div>
              <span>Profile</span>
            </li>
            <li 
              className={activeSection === 'overview' ? 'active' : ''} 
              onClick={() => setActiveSection('overview')}
            >
              <div className="nav-icon overview-icon"></div>
              <span>Overview</span>
            </li>
            <li 
              className={activeSection === 'invoices' ? 'active' : ''} 
              onClick={() => setActiveSection('invoices')}
            >
              <div className="nav-icon invoices-icon"></div>
              <span>View Invoices</span>
            </li>
            <li 
              className={activeSection === 'settings' ? 'active' : ''} 
              onClick={() => setActiveSection('settings')}
            >
              <div className="nav-icon settings-icon"></div>
              <span>Settings</span>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <div className="nav-icon logout-icon"></div>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-menu">
            <div className="notification-icon"></div>
            <div className="user-info">
              <span className="user-name">{user?.name || user?.email}</span>
              <div className="user-avatar">
                {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="content-area">
          {renderActiveSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 