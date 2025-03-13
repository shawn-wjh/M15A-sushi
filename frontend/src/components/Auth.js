import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API_URL = 'http://localhost:3000/v1/users';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user data');
      }
    }
    
    // Animation delay
    const timer = setTimeout(() => {
      document.querySelector('.auth-form-container').classList.add('visible');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const endpoint = isLogin 
        ? `${API_URL}/login`
        : `${API_URL}/register`;
        
      const payload = isLogin 
        ? { email, password }
        : { email, password, name };
        
      const response = await axios.post(endpoint, payload);
      
      setMessage({
        type: 'success',
        text: response.data.message || 'Operation successful'
      });
      
      if (response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'An error occurred'
      });
      console.error('Auth error:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMessage({
      type: 'success',
      text: 'Logged out successfully'
    });
  };
  
  const backToHome = () => {
    history.push('/');
  };
  
  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-success-container">
          <div className="auth-logo" onClick={backToHome}>
            <span className="logo-text">Sushi</span>
            <span className="logo-dot">.</span>
            <span className="logo-invoice">Invoice</span>
          </div>
          
          <div className="success-icon">✓</div>
          <h2>Welcome, {user.name || user.email}!</h2>
          <p>You are now logged in to your Sushi Invoice account.</p>
          
          <div className="user-details">
            <div className="user-detail">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>
            {user.name && (
              <div className="user-detail">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{user.name}</span>
              </div>
            )}
            <div className="user-detail">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{user.UserID || user.userId || 'Not available'}</span>
            </div>
          </div>
          
          <div className="auth-buttons">
            <button className="auth-button primary" onClick={() => history.push('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="auth-button secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <div className="auth-decoration">
          <div className="decoration-sushi"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-logo" onClick={backToHome}>
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </div>
        
        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Welcome back! Please enter your details.' 
            : 'Join Sushi Invoice for precise invoicing.'}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required={!isLogin} 
                className="auth-input"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="auth-input"
              placeholder="name@company.com"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
          
          {message && (
            <div className={`auth-message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`auth-button primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <p className="auth-toggle">
          {isLogin 
            ? "Don't have an account? " 
            : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="toggle-button"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        
        <button 
          onClick={backToHome} 
          className="back-button"
        >
          ← Back to Home
        </button>
      </div>
      
      <div className="auth-decoration">
        <div className="decoration-sushi"></div>
      </div>
    </div>
  );
};

export default Auth; 