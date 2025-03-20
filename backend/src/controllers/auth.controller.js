/**
 * Authentication Controller
 * Handles user authentication, token generation, and verification
 */
const { createDynamoDBClient, Tables } = require('../config/database');
const config = require('../config/auth');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize DynamoDB client
const dbClient = createDynamoDBClient();

const authController = {
  /**
   * Login user and generate JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      // 1. Find user in database
      const queryParams = {
        TableName: Tables.USERS,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      };

      // Use ScanCommand instead of QueryCommand for simple email filtering
      const queryResult = await dbClient.send(new ScanCommand(queryParams));

      // 2. Check if user exists
      if (!queryResult.Items?.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const user = queryResult.Items[0];

      // 3. Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid password'
        });
      }

      // 4. Generate JWT token
      const tokenPayload = {
        userId: user.UserID,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            UserID: user.UserID
          },
          token
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Login failed',
        details: error.message
      });
    }
  }

  // TODO: commented out for now to save coverage

  // /**
  //  * Refresh JWT token
  //  * @param {Object} req - Express request object
  //  * @param {Object} res - Express response object
  //  */
  // refreshToken: async (req, res) => {
  //   try {
  //     // TODO:
  //     // 1. Extract refresh token from request
  //     // 2. Verify refresh token
  //     // 3. Find user associated with token
  //     // 4. Generate new access token
  //     // 5. Return new token

  //     return res.status(200).json({
  //       status: "success",
  //       message: "Token refreshed successfully",
  //       data: {
  //         // New token will go here
  //       },
  //     });
  //   } catch (error) {
  //     return res.status(401).json({
  //       status: "error",
  //       message: "Invalid or expired refresh token",
  //     });
  //   }
  // },

  // /**
  //  * Logout user (invalidate token)
  //  * @param {Object} req - Express request object
  //  * @param {Object} res - Express response object
  //  */
  // logout: async (req, res) => {
  //   try {
  //     // TODO:
  //     // 1. Extract token from request
  //     // 2. Add token to blacklist or invalidate (if applicable)
  //     // 3. Return success response

  //     return res.status(200).json({
  //       status: "success",
  //       message: "Logout successful",
  //     });
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //     return res.status(500).json({
  //       status: "error",
  //       message: "Logout failed",
  //       details: error.message,
  //     });
  //   }
  // },

  // /**
  //  * Get current user information
  //  * @param {Object} req - Express request object
  //  * @param {Object} res - Express response object
  //  */
  // getCurrentUser: async (req, res) => {
  //   try {
  //     // TODO:
  //     // 1. Extract user ID from authenticated request
  //     // 2. Find user in database
  //     // 3. Return user information

  //     return res.status(200).json({
  //       status: "success",
  //       data: {
  //         // User data will go here
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Get current user error:", error);
  //     return res.status(500).json({
  //       status: "error",
  //       message: "Failed to retrieve user information",
  //       details: error.message,
  //     });
  //   }
  // },

  // /**
  //  * Change password
  //  * @param {Object} req - Express request object
  //  * @param {Object} res - Express response object
  //  */
  // changePassword: async (req, res) => {
  //   try {
  //     // TODO:
  //     // 1. Extract current password and new password from request
  //     // 2. Find user in database
  //     // 3. Verify current password
  //     // 4. Hash new password
  //     // 5. Update password in database
  //     // 6. Return success response

  //     return res.status(200).json({
  //       status: "success",
  //       message: "Password changed successfully",
  //     });
  //   } catch (error) {
  //     console.error("Change password error:", error);
  //     return res.status(500).json({
  //       status: "error",
  //       message: "Failed to change password",
  //       details: error.message,
  //     });
  //   }
  // },
};

module.exports = authController;
