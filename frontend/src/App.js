import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/invoiceList/InvoiceList';
import InvoicePage from './components/invoiceView/InvoicePage';
import Welcome from './components/Welcome';
import './App.css';

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
          <ProtectedRoute path="/invoice/create" component={InvoiceForm} />
          <ProtectedRoute path="/invoices/list" component={InvoiceList} />
          <ProtectedRoute path="/invoices/:invoiceid" component={InvoicePage} />
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
