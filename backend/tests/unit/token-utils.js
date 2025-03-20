const jwt = require('jsonwebtoken');
const authConfig = require('../../src/config/auth');

/**
 * Utility functions for creating tokens in tests
 */

/**
 * Generate a valid JWT token for testing
 * @param {Object} payload - Custom payload to include in token
 * @returns {string} JWT token
 */
const generateValidToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };

  const tokenPayload = { ...defaultPayload, ...payload };
  return jwt.sign(tokenPayload, authConfig.jwt.secret, { 
    expiresIn: authConfig.jwt.expiresIn 
  });
};

/**
 * Generate an expired JWT token for testing
 * @param {Object} payload - Custom payload to include in token
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };

  const tokenPayload = { ...defaultPayload, ...payload };
  return jwt.sign(tokenPayload, authConfig.jwt.secret, { 
    expiresIn: '0s' // Instantly expires
  });
};

/**
 * Generate a token signed with wrong secret for testing
 * @param {Object} payload - Custom payload to include in token
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };

  const tokenPayload = { ...defaultPayload, ...payload };
  return jwt.sign(tokenPayload, 'wrong-secret', { 
    expiresIn: authConfig.jwt.expiresIn 
  });
};

/**
 * Generate a malformed token for testing
 * @returns {string} Malformed token
 */
const generateMalformedToken = () => {
  return 'this-is-not-a-valid-jwt-token';
};

module.exports = {
  generateValidToken,
  generateExpiredToken,
  generateInvalidToken,
  generateMalformedToken
}; 