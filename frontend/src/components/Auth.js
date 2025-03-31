import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './Auth.css';

// Helper functions for cookie management
const setCookie = (name, value, days = 7) => {
  // 6 hours expiration
  const expires = new Date(Date.now() + 6 * 3600 * 1000).toUTCString();
  // Using SameSite=None with Secure for cross-origin requests
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
};

const removeCookie = (name) => {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
};

const Auth = ({ isLoginForm }) => {
  const [isLogin, setIsLogin] = useState(isLoginForm !== false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  
  useEffect(() => {
    // Check if user is already logged in
    const storedToken = getCookie('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user data');
      }
    }
    
    // Update login state if prop changes
    if (isLoginForm !== undefined) {
      setIsLogin(isLoginForm);
    }
    
    // Animation delay
    const timer = setTimeout(() => {
      document.querySelector('.auth-form-container').classList.add('visible');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isLoginForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const endpoint = isLogin ? '/v1/users/login' : '/v1/users/register';
        
      const payload = isLogin 
        ? { email, password }
        : { email, password, name };
        
      const response = await apiClient.post(endpoint, payload);
      
      console.log('Login response:', response.data);
      
      setMessage({
        type: 'success',
        text: response.data.message || 'Operation successful'
      });
      
      // Check for token in the correct location in the response
      const token = response.data.data?.token || response.data.token;
      const userData = response.data.data?.user || response.data.user;
      
      console.log('Extracted token:', !!token);
      console.log('Extracted user data:', userData);
      
      if (token && userData) {
        // Store token in cookie instead of localStorage
        setCookie('token', token);
        
        // Still store user data in localStorage for easy access
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        console.log('User data stored, redirecting to dashboard...');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          history.push('/dashboard');
          console.log('Redirect called with timeout');
        }, 100);
      } else {
        console.warn('No token or user data received in response');
        console.warn('Response structure:', response.data);
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    // Remove token from cookies instead of localStorage
    removeCookie('token');
    localStorage.removeItem('user');
    setUser(null);
    setMessage({
      type: 'success',
      text: 'Logged out successfully'
    });
  };
  
  const backToHome = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      history.push('/dashboard');
    } else {
      history.push('/');
    }
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