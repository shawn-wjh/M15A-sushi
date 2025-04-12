import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './Dashboard.css';
// Import icons - assuming we'll use Font Awesome or similar
// If not available, we'll need to add the package
import InvoiceForm from './InvoiceForm';
import InvoiceList from './invoiceList/InvoiceList';
import AppLayout from './AppLayout';
import PeppolSettings from './PeppolSettings';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(location.state?.section || 'overview');
  const history = useHistory();
  const [activeSettingsTab, setActiveSettingsTab] = useState('peppol');

  // Parse URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const settingsParam = searchParams.get('settings');
    
    if (tabParam === 'settings') {
      setActiveSection('settings');
      
      if (settingsParam) {
        setActiveSettingsTab(settingsParam);
      }
    }
  }, [location.search]);

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

  // Add useEffect to handle location state
  useEffect(() => {
    if (location.state?.fromShared) {
      setActiveSection('shared-invoices');
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
      case 'shared-invoices':
        return renderSharedInvoicesSection();
      case 'createInvoice':
        history.push('/invoices/create');
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

  const renderSharedInvoicesSection = () => {
    return (
      <div className="invoice-list-section">
        <InvoiceList displaySharedInvoices={true} />
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
        
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeSettingsTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('account')}
          >
            Account Information
          </button>
          <button 
            className={`tab-button ${activeSettingsTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('security')}
          >
            Security
          </button>
          <button 
            className={`tab-button ${activeSettingsTab === 'peppol' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('peppol')}
          >
            Peppol Integration
          </button>
        </div>
        
        <div className="settings-content">
          {activeSettingsTab === 'peppol' && <PeppolSettings />}
          
          {activeSettingsTab === 'account' && (
            <div className="settings-placeholder">
              <div className="settings-option">
                <h3>Personal Information</h3>
                <p>Update your personal details and contact information</p>
                <div className="form-field" style={{ marginTop: '20px' }}>
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" defaultValue={user?.name || ''} placeholder="Enter your full name" />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" defaultValue={user?.email || ''} placeholder="Enter your email" />
                </div>
                <div className="form-field">
                  <label htmlFor="company">Company Name</label>
                  <input type="text" id="company" defaultValue="" placeholder="Enter your company name" />
                </div>
                <button className="btn btn-primary" style={{ marginTop: '15px' }}>Save Changes</button>
              </div>
              
              <div className="settings-option">
                <h3>Business Information</h3>
                <p>Update your business details for invoicing</p>
                <div className="form-field" style={{ marginTop: '20px' }}>
                  <label htmlFor="business-id">Business ID</label>
                  <input type="text" id="business-id" placeholder="Enter your business ID" />
                </div>
                <div className="form-field">
                  <label htmlFor="tax-id">Tax ID / VAT Number</label>
                  <input type="text" id="tax-id" placeholder="Enter your tax ID" />
                </div>
                <div className="form-field">
                  <label htmlFor="address">Business Address</label>
                  <textarea id="address" rows="3" placeholder="Enter your business address"></textarea>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '15px' }}>Save Changes</button>
              </div>
            </div>
          )}
          
          {activeSettingsTab === 'security' && (
            <div className="settings-placeholder">
              <div className="settings-option">
                <h3>Password Management</h3>
                <p>Change your password to maintain account security</p>
                <form autoComplete="off" method="post">
                  {/* Hidden field to prevent autofill */}
                  <input type="text" name="username" style={{ display: 'none' }} />
                  <input type="password" name="password" style={{ display: 'none' }} />
                  
                  <div className="form-field" style={{ marginTop: '20px' }}>
                    <label htmlFor="current-password">Current Password</label>
                    <input 
                      type="password" 
                      id="current-password" 
                      name="current-password"
                      placeholder="Enter your current password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="new-password">New Password</label>
                    <input 
                      type="password" 
                      id="new-password" 
                      name="new-password"
                      placeholder="Enter your new password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="confirm-password" 
                      name="confirm-password"
                      placeholder="Confirm your new password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <button type="button" className="settings-save-button">
                    Update Password
                  </button>
                </form>
              </div>
              
              <div className="settings-option">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
                
                <div style={{ marginTop: '20px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                      Status: <span style={{ color: '#ff4b4b' }}>Disabled</span>
                    </div>
                    <div style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>
                      Enhance your account security by enabling 2FA
                    </div>
                    <button className="settings-save-button" style={{ marginTop: '0' }}>
                      Enable
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '30px' }}>
                  <h3>Session Management</h3>
                  <p>Sign out from all other devices</p>
                  
                  <div style={{ marginTop: '16px' }}>
                    <button 
                      className="settings-save-button" 
                      style={{ 
                        backgroundColor: 'transparent', 
                        border: '1px solid #ff4b4b', 
                        color: '#ff4b4b', 
                        marginTop: '0'
                      }}
                    >
                      Sign out everywhere
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
    <AppLayout activeSection={activeSection}>
      {renderActiveSectionContent()}
    </AppLayout>
  );
};

export default Dashboard; 