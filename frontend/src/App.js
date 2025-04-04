import React, { useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/invoiceList/InvoiceList';
import InvoicePage from './components/invoiceView/InvoicePage';
import Welcome from './components/Welcome';
import ValidationResults from './components/invoiceValidationResult/validationResults';
import './App.css';
import apiClient from './utils/axiosConfig';
import parseInvoiceXml from './utils/parseXmlHelper';

// Protected route component
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Public route component that redirects to dashboard if user is logged in
const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated && restricted ? (
          <Redirect to="/dashboard" />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

// Edit Invoice route component that passes invoice data to InvoiceForm
const EditInvoiceRoute = (props) => {
  const { location, match } = props;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // If invoice data is already in location state, use it
        if (location.state?.invoice) {
          setInvoice(location.state.invoice);
          setLoading(false);
          return;
        }

        // Otherwise, fetch the invoice data
        const invoiceId = match.params.invoiceid;
        const response = await apiClient.get(`/v1/invoices/${invoiceId}`);
        const invoiceData = parseInvoiceXml(response.data);
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [location.state, match.params.invoiceid]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <Redirect to="/dashboard" />;
  }

  if (!invoice) {
    return <Redirect to="/dashboard" />;
  }
  
  return <InvoiceForm editMode={true} invoiceToEdit={invoice} />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Switch>
          <Route exact path="/welcome" component={Welcome} />
          <PublicRoute restricted={true} exact path="/" component={LandingPage} />
          <PublicRoute restricted={true} path="/auth" component={Auth} />
          <PublicRoute restricted={true} path="/login" component={() => <Auth isLoginForm={true} />} />
          <PublicRoute restricted={true} path="/signup" component={() => <Auth isLoginForm={false} />} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/invoices/create" component={InvoiceForm} />
          <ProtectedRoute path="/invoices/edit/:invoiceid" component={EditInvoiceRoute} />
          <ProtectedRoute path="/invoices/:invoiceid" component={InvoicePage} />
          <ProtectedRoute path="/validation-result" component={ValidationResults} />
          <ProtectedRoute path="/settings" component={Dashboard} />
          <Route path="*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
