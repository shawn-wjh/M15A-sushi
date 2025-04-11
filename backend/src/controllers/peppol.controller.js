/**
 * Peppol Controller
 * Handles user Peppol API credentials and settings
 */
const { createDynamoDBClient, Tables } = require('../config/database');
const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const dbClient = createDynamoDBClient();

const peppolController = {
  /**
   * Save user's Peppol API credentials
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  saveCredentials: async (req, res) => {
    try {
      const { peppolApiKey, peppolApiUrl, peppolId } = req.body;
      const userId = req.user.userId;
      
      if (!peppolApiKey || !peppolApiUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'API Key and API URL are required'
        });
      }
      
      // Update user record with Peppol credentials
      const updateParams = {
        TableName: Tables.USERS,
        Key: { 
          UserID: userId 
        },
        UpdateExpression: 'set peppolSettings = :peppolSettings, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':peppolSettings': {
            apiKey: peppolApiKey,
            apiUrl: peppolApiUrl,
            peppolId: peppolId || null,
            isConfigured: true
          },
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };
      
      // Execute the update command (result not used)
      await dbClient.send(new UpdateCommand(updateParams));
      
      return res.status(200).json({
        status: 'success',
        message: 'Peppol settings saved successfully',
        data: {
          peppolConfigured: true
        }
      });
    } catch (error) {
      console.error('Error saving Peppol settings:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save Peppol settings',
        details: error.message
      });
    }
  },
  
  /**
   * Get user's Peppol settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSettings: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const getParams = {
        TableName: Tables.USERS,
        Key: { 
          UserID: userId 
        }
      };
      
      const result = await dbClient.send(new GetCommand(getParams));
      
      if (!result.Item) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      const peppolSettings = result.Item.peppolSettings || {
        isConfigured: false
      };
      
      // Never return the actual API key to frontend for security
      if (peppolSettings.apiKey) {
        peppolSettings.apiKey = '••••••••' + peppolSettings.apiKey.substr(-4);
      }
      
      return res.status(200).json({
        status: 'success',
        data: peppolSettings
      });
    } catch (error) {
      console.error('Error retrieving Peppol settings:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve Peppol settings',
        details: error.message
      });
    }
  },

  /**
   * Delete user's Peppol settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteSettings: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Update user record to remove Peppol credentials
      const updateParams = {
        TableName: Tables.USERS,
        Key: { 
          UserID: userId 
        },
        UpdateExpression: 'remove peppolSettings set updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };
      
      await dbClient.send(new UpdateCommand(updateParams));
      
      return res.status(200).json({
        status: 'success',
        message: 'Peppol settings removed successfully'
      });
    } catch (error) {
      console.error('Error deleting Peppol settings:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete Peppol settings',
        details: error.message
      });
    }
  }
};

module.exports = peppolController; 