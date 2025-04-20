const { createDynamoDBClient, Tables } = require('../config/database');
const bcrypt = require('bcrypt');
const owasp = require('owasp-password-strength-test');
const validator = require('validator');
const config = require('../config/auth');
const { QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const jwt = require('jsonwebtoken');

const dbClient = createDynamoDBClient();

const PASSWORD_HISTORY_LIMIT = 5;

owasp.config({
  allowPassphrases: true,
  minLength: 10,
  minOptionalTestsToPass: 3
});

const userController = {
  updateDetails: async (req, res) => {
    const { password, email, name } = req.body;
    const userId = req.user.userId;

    // No validation required if no fields are provided
    if (!password && !email && !name) {
      return res.status(200).json({ 
        message: 'No changes to update.',
        token: req.headers.authorization?.split(' ')[1] // Return existing token
      });
    }

    try {
      // Fetch user from DynamoDB
      const queryParams = {
        TableName: Tables.USERS,
        KeyConditionExpression: 'UserID = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      };

      const result = await dbClient.send(new QueryCommand(queryParams));
      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.Items[0];
      let updateExpression = 'SET ';
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};
      let hasUpdates = false;

      // Validate and prepare email update
      if (email && email !== user.email.S) {
        if (!validator.isEmail(email)) {
          return res.status(400).json({ error: 'Invalid email address.' });
        }
        updateExpression += '#email = :email, ';
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = { S: email };
        hasUpdates = true;
      }

      // Prepare name update
      if (name && name !== user.name.S) {
        updateExpression += '#name = :name, ';
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = { S: name };
        hasUpdates = true;
      }

      // Validate and prepare password update
      if (password) {
        const strength = owasp.test(password);
        if (strength.errors.length > 0) {
          return res.status(400).json({ error: strength.errors.join(' ') });
        }

        const previousPasswords = user.previousPasswords?.L || [];
        const currentPassword = user.password.S;

        for (let oldHash of previousPasswords) {
          const isSame = await bcrypt.compare(password, oldHash.S);
          if (isSame) {
            return res.status(400).json({
              error: 'You have used this password before. Choose a different one.'
            });
          }
        }

        const newHashedPassword = await bcrypt.hash(password, config.password.saltRounds);
        const updatedPrevious = [
          { S: currentPassword },
          ...previousPasswords
        ].slice(0, PASSWORD_HISTORY_LIMIT);

        updateExpression += 'password = :password, previousPasswords = :previousPasswords, ';
        expressionAttributeValues[':password'] = { S: newHashedPassword };
        expressionAttributeValues[':previousPasswords'] = { L: updatedPrevious };
        hasUpdates = true;
      }

      // Only perform update if there are actual changes
      if (hasUpdates) {
        // Remove trailing comma and space
        updateExpression = updateExpression.slice(0, -2);

        await dbClient.send(
          new UpdateItemCommand({
            TableName: Tables.USERS,
            Key: { UserID: { S: userId } },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
          })
        );

        // Generate new token with updated user info
        const updatedUser = {
          ...user,
          ...(email && { email: { S: email } }),
          ...(name && { name: { S: name } })
        };

        const token = jwt.sign(
          { 
            userId: updatedUser.UserID.S, 
            email: updatedUser.email.S, 
            name: updatedUser.name.S 
          },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );

        return res.status(200).json({ 
          message: 'Details updated successfully.', 
          token: token,
          user: {
            userId: updatedUser.UserID.S,
            email: updatedUser.email.S,
            name: updatedUser.name.S
          }
        });
      } else {
        return res.status(200).json({ 
          message: 'No changes to update.',
          token: req.headers.authorization?.split(' ')[1], // Return existing token
          user: {
            userId: user.UserID.S,
            email: user.email.S,
            name: user.name.S
          }
        });
      }

    } catch (error) {
      console.error('Error updating details:', error);
      return res.status(500).json({ error: 'Failed to update details.' });
    }
  }
};

module.exports = userController;
