import React from 'react';

const ActionBarIcon = ({ onClick, title, children, className }) => {
  return (
    <button
      className={`action-bar-icon ${className}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default ActionBarIcon; 