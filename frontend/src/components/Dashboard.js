import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const history = useHistory();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Dashboard - Checking authentication');
    console.log('Stored user:', storedUser);
    console.log('Token exists:', !!token);
    
    if (!storedUser || !token) {
      // Redirect to login if not logged in
      console.log('Not authenticated, redirecting to login');
      history.push('/auth');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      console.log('User data parsed successfully:', userData);
      
      // Set user state
      setUser(userData);
      
      // Animation delay
      const timer = setTimeout(() => {
        const container = document.querySelector('.dashboard-container');
        if (container) {
          container.classList.add('visible');
          console.log('Dashboard container made visible');
        } else {
          console.warn('Dashboard container element not found');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Error parsing stored user data:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      history.push('/auth');
    }
  }, [history]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    history.push('/auth');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-logo" onClick={() => history.push('/')}>
            <span className="logo-text">Sushi</span>
            <span className="logo-dot">.</span>
            <span className="logo-invoice">Invoice</span>
          </div>
          
          <div className="user-info">
            <span className="user-name">{user.name || user.email}</span>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
        </header>
        
        <div className="dashboard-content">
          <nav className="dashboard-nav">
            <ul>
              <li 
                className={activeTab === 'create' ? 'active' : ''} 
                onClick={() => setActiveTab('create')}
              >
                Create Invoice
              </li>
              <li 
                className={activeTab === 'list' ? 'active' : ''} 
                onClick={() => setActiveTab('list')}
              >
                My Invoices
              </li>
            </ul>
          </nav>
          
          <main className="dashboard-main">
            {activeTab === 'create' && (
              <div className="tab-content">
                <h2>Create New Invoice</h2>
                <p>Fill in the details below to generate a new invoice.</p>
                <InvoiceForm />
              </div>
            )}
            
            {activeTab === 'list' && (
              <div className="tab-content">
                <h2>My Invoices</h2>
                <p>View and manage your existing invoices.</p>
                <div className="invoice-list-placeholder">
                  <p>Invoice list will be implemented in the next iteration.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 