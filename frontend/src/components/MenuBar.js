import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './MenuBar.css';

const MenuBar = ({ activeSection, setActiveSection }) => {
  const history = useHistory();
  const [logoClicked, setLogoClicked] = useState(false);
  
  // Reset the animation state after the animation completes
  useEffect(() => {
    if (logoClicked) {
      const timer = setTimeout(() => {
        setLogoClicked(false);
      }, 600); // Animation duration plus a little extra
      
      return () => clearTimeout(timer);
    }
  }, [logoClicked]);

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    // Clear auth cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    // Redirect to login
    history.push('/login');
  };

  const handleCreateInvoice = () => {
    history.push('/create-invoice');
  };

  const handleLogoClick = () => {
    // Trigger animation
    setLogoClicked(true);
    
    // Navigate to dashboard overview section with animation
    history.push('/dashboard', { section: 'overview' });
  };
  
  const handleSectionChange = (section) => {
    // If on dashboard already, just update the section
    if (history.location.pathname === '/dashboard') {
      // If setActiveSection was provided (from Dashboard), use it
      if (setActiveSection) {
        setActiveSection(section);
      } else {
        // Otherwise navigate with state
        history.push('/dashboard', { section });
      }
    } else {
      // Navigate to dashboard with the specified section
      history.push('/dashboard', { section });
    }
  };

  return (
    <div className="menu-sidebar">
      <div className="menu-sidebar-header">
        <div 
          className={`menu-dashboard-logo animated-logo ${logoClicked ? 'logo-clicked' : ''}`} 
          onClick={handleLogoClick}
        >
          <span className="menu-logo-text">Sushi</span>
          <span className="menu-logo-dot">.</span>
          <span className="menu-logo-invoice">Invoice</span>
          {logoClicked && <span className="logo-ripple"></span>}
        </div>
      </div>
      
      <div className="menu-buttons-container">
        <button className="menu-create-invoice-button" onClick={handleCreateInvoice}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Create Invoice
        </button>
      </div>
      
      <nav className="menu-sidebar-nav">
        <ul>
          <li 
            className={activeSection === 'profile' ? 'menu-active' : ''} 
            onClick={() => handleSectionChange('profile')}
          >
            <div className="menu-nav-icon menu-profile-icon"></div>
            <span>Profile</span>
          </li>
          <li 
            className={activeSection === 'overview' ? 'menu-active' : ''} 
            onClick={() => handleSectionChange('overview')}
          >
            <div className="menu-nav-icon menu-overview-icon"></div>
            <span>Overview</span>
          </li>
          <li 
            className={activeSection === 'invoices' ? 'menu-active' : ''} 
            onClick={() => handleSectionChange('invoices')}
          >
            <div className="menu-nav-icon menu-invoices-icon"></div>
            <span>View Invoices</span>
          </li>
          <li 
            className={activeSection === 'settings' ? 'menu-active' : ''} 
            onClick={() => handleSectionChange('settings')}
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