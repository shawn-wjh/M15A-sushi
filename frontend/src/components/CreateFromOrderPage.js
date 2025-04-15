import React from 'react';
import { useHistory } from 'react-router-dom';
import OrderSearch from './OrderSearch';
import AppLayout from './AppLayout';
import './CreateFromOrderPage.css';

const CreateFromOrderPage = () => {
  const history = useHistory();

  const handleOrderSelect = (orderData) => {
    // Navigate to the invoice form with the order data
    history.push({
      pathname: '/invoices/create',
      state: { orderData }
    });
  };

  return (
    <AppLayout activeSection="createInvoice">
      <div className="create-from-order-container">
        <div className="create-from-order-header">
          <h2>Create Invoice from Order</h2>
          <p>Enter the order details to generate an invoice</p>
        </div>
        
        <div className="order-search-wrapper">
          <OrderSearch onOrderSelect={handleOrderSelect} />
        </div>
        
        <div className="back-button-container">
          <button 
            className="back-button" 
            onClick={() => history.push('/invoices/create-selection')}
          >
            Back to Selection
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateFromOrderPage; 