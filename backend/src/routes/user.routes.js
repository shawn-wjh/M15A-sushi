const express = require('express');
const router = express.Router();

// Import middleware
const validation = require('../middleware/user-validation');

// Import controllers
const registrationController = require('../controllers/registration.controller');
const authController = require('../controllers/auth.controller');

/**
 * Register user
 * @route POST /v1/users/register
 * @returns {object} 200 - User registered successfully
 */
router.post('/register', 
    validation.validateEmail,
    validation.validatePassword,
    registrationController.register
);

/**
 * Login user
 * @route POST /v1/users/login
 * @returns {object} 200 - User logged in successfully
 */
router.post('/login', 
    validation.validateEmail,  
    validation.validatePassword,
    authController.login
);

















module.exports = router;