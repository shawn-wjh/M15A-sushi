import React from 'react';
import { useHistory } from 'react-router-dom';
import './MenuBar.css';

const MenuBar = ({ activeSection, setActiveSection }) => {
  const history = useHistory();

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    // Clear auth cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    // Redirect to login
    history.push('/login');
  };

  const handleCreateInvoice = () => {
    history.push('/dashboard', { section: 'createInvoice' });
  };

  return (
    <div className="menu-sidebar">
      <div className="menu-sidebar-header">
        <div className="menu-dashboard-logo">
          <span className="menu-logo-text">Sushi</span>
          <span className="menu-logo-dot">.</span>
          <span className="menu-logo-invoice">Invoice</span>
        </div>
      </div>
      
      <div className="menu-create-invoice-button-container">
        <button className="menu-create-invoice-button" onClick={handleCreateInvoice}>
          <span className="menu-plus-icon">+</span>
          Create Invoice
        </button>
      </div>
      
      <nav className="menu-sidebar-nav">
        <ul>
          <li 
            className={activeSection === 'profile' ? 'menu-active' : ''} 
            onClick={() => history.push('/dashboard', { section: 'profile' })}
          >
            <div className="menu-nav-icon menu-profile-icon"></div>
            <span>Profile</span>
          </li>
          <li 
            className={activeSection === 'overview' ? 'menu-active' : ''} 
            onClick={() => history.push('/dashboard', { section: 'overview' })}
          >
            <div className="menu-nav-icon menu-overview-icon"></div>
            <span>Overview</span>
          </li>
          <li 
            className={activeSection === 'invoices' ? 'menu-active' : ''} 
            onClick={() => history.push('/dashboard', { section: 'invoices' })}
          >
            <div className="menu-nav-icon menu-invoices-icon"></div>
            <span>View Invoices</span>
          </li>
          <li 
            className={activeSection === 'settings' ? 'menu-active' : ''} 
            onClick={() => history.push('/dashboard', { section: 'settings' })}
          >
            <div className="menu-nav-icon menu-settings-icon"></div>
            <span>Settings</span>
          </li>
        </ul>
      </nav>
      
      <div className="menu-sidebar-footer">
        <button className="menu-logout-button" onClick={handleLogout}>
          <div className="menu-nav-icon menu-logout-icon"></div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default MenuBar; 