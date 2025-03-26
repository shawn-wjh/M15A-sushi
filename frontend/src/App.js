import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/invoiceList/InvoiceList';
import InvoicePage from './components/invoiceView/InvoicePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Switch>
          <Route exact path="/" component={LandingPage} />
          <Route path="/auth" component={Auth} />
          <Route path="/login" component={() => <Auth isLoginForm={true} />} />
          <Route path="/signup" component={() => <Auth isLoginForm={false} />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/invoice/create" component={InvoiceForm} />
          <Route path="/invoices/list" component={InvoiceList} />
          <Route path="/invoices/:invoiceid" component={InvoicePage} />
          <Route path="/settings" component={Dashboard} />
          <Route path="*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
