const express = require('express');

const router = express.Router();

// Import middleware
const validation = require('../middleware/user-validation');
const auth = require('../middleware/auth');

// Import controllers
const registrationController = require('../controllers/registration.controller');
const authController = require('../controllers/auth.controller');
const peppolController = require('../controllers/peppol.controller');

/**
 * Register user
 * @route POST /v1/users/register
 * @returns {object} 200 - User registered successfully
 */
router.post(
  '/register',
  validation.validateEmail,
  validation.validatePassword,
  registrationController.register
);

/**
 * Login user
 * @route POST /v1/users/login
 * @returns {object} 200 - User logged in successfully
 */
router.post(
  '/login',
  authController.login
);

/**
 * Get user profile
 * @route GET /v1/users/profile
 * @returns {object} 200 - User profile data
 */
router.get(
  '/profile',
  auth.verifyToken,
  (req, res) => {
    // The user data is already available in req.user from the verifyToken middleware
    return res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  }
);

/**
 * Get user's Peppol settings
 * @route GET /v1/users/peppol-settings
 * @returns {object} 200 - User's Peppol settings
 */
router.get(
  '/peppol-settings',
  auth.verifyToken,
  peppolController.getSettings
);

/**
 * Save user's Peppol settings
 * @route POST /v1/users/peppol-settings
 * @returns {object} 200 - Peppol settings saved successfully
 */
router.post(
  '/peppol-settings',
  auth.verifyToken,
  peppolController.saveCredentials
);

/**
 * Delete user's Peppol settings
 * @route DELETE /v1/users/peppol-settings
 * @returns {object} 200 - Peppol settings deleted successfully
 */
router.delete(
  '/peppol-settings',
  auth.verifyToken,
  peppolController.deleteSettings
);

module.exports = router;
