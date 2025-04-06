import React from 'react';
import MenuBar from './MenuBar';
import TopBar from './TopBar';
import './AppLayout.css';

const AppLayout = ({ children, activeSection }) => {
  return (
    <div className="app-layout">
      <MenuBar activeSection={activeSection} />
      <div className="app-content">
        <TopBar />
        <main className="main-content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 