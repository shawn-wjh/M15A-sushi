const express = require('express');
const router = express.Router();

// Import middleware
const { validateUserInput } = require('../middleware/user-validation');

// Import controllers
const { register } = require('../controllers/user.controller');


/**
 * Register user
 * @route POST /v1/users/register
 * @returns {object} 200 - User registered successfully
 */
router.post('/register', 
    validateUserInput,
    register
);

















module.exports = router;