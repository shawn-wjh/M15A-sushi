/**
 * Registration Controller
 */
const { createDynamoDBClient, Tables } = require('../config/database');
const config = require('../config/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const dbClient = createDynamoDBClient();

const registrationController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => { 
    // using async because we're using await, allowing other requests to continue while we wait for the database to respond
    try {
      // 1. Extract user data from request body
      const { email, password, name } = req.body;

      // Additional validation for required fields
      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'Name is required'
        });
      }

      // 2. Check if user already exists
      const getUserParams = {
        TableName: Tables.USERS,
        Key: {
          email: email.toLowerCase()
        }
      };

      const existingUser = await dbClient.send(new GetCommand(getUserParams));
      
      if (existingUser.Item) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }

      // 3. Hash the password
      const hashedPassword = await bcrypt.hash(password, config.password.saltRounds);

      // 4. Generate user ID
      const userId = uuidv4();

      // 5. Create user object
      const newUser = {
        userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user', // Default role
        status: 'active', // Default status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 6. Store user in database
      const putUserParams = {
        TableName: Tables.USERS,
        Item: newUser
      };

      await dbClient.send(new PutCommand(putUserParams));

      // 7. Generate JWT token
      const tokenPayload = {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role
      };

      const token = jwt.sign(
        tokenPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 8. Return success response
      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          userId: newUser.userId,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to register',
        details: error.message
      });
    }
  },
};

module.exports = registrationController;
