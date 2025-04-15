// const jwt = require('jsonwebtoken');
// const authConfig = require('../config/auth');

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Authentication Middleware
 */
const auth = {
  /**
   * Verify JWT token middleware
   * Used to protect routes that require authentication
   */
  verifyToken: async (req, res, next) => {
    try {
      // 1. Get token from Authorization header or cookies
      let token = null;

      // Check Authorization header (Bearer token)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
      // Check cookies
      else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      // If no token found, return 401 Unauthorized
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'No authentication token provided'
        });
      }

      // 2. Verify token using jwt
      const decoded = jwt.verify(token, authConfig.jwt.secret);

      // 3. Add user data to request object for use in subsequent middleware/routes
      req.user = {
        userId: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      };

      console.log('User:', req.user);

      // 4. Call next() if successful
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);

      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication token has expired'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid authentication token'
        });
      }

      // Generic error response
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  },

  /**
   * Check if user is authenticated
   * Used as a simpler version of verifyToken when you just need to check auth status
   */
  isAuthenticated: async (req, res, next) => {
    try {
      // 1. Check if user exists in request (set by verifyToken middleware)
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated'
        });
      }

      // 2. Call next() if exists
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }
  }
};

module.exports = auth;
