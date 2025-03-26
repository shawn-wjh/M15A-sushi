import React from 'react';

export const ValidateIcon = ({ onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}; 