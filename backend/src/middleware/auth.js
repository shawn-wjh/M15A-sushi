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
      // TODO:
      // 1. Get token from Authorization header
      // 2. Verify token using jwt
      // 3. Add user data to request object
      // 4. Call next() if successful
    } catch (error) {
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
      // TODO:
      // 1. Check if user exists in request
      // 2. Call next() if exists
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }
  },

    // /**
    //  * Check user role permissions
    //  * Used to restrict routes based on user role
    //  */
    // checkRole: (allowedRoles) => {
    //     return async (req, res, next) => {
    //         try {
    //             // TODO:
    //             // 1. Get user role from request
    //             // 2. Check if role is in allowedRoles
    //             // 3. Call next() if allowed
    //         } catch (error) {
    //             return res.status(403).json({
    //                 status: 'error',
    //                 message: 'Insufficient permissions'
    //             });
    //         }
    //     };
    // },

    // /**
    //  * Refresh JWT token
    //  * Used to issue a new token before the old one expires
    //  */
    // refreshToken: async (req, res, next) => {
    //     try {
    //         // TODO:
    //         // 1. Get current token
    //         // 2. Verify it's still valid
    //         // 3. Generate new token
    //         // 4. Return new token
    //     } catch (error) {
    //         return res.status(401).json({
    //             status: 'error',
    //             message: 'Could not refresh token'
    //         });
    //     }
    // }
};

module.exports = auth;
