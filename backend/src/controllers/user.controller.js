const { createDynamoDBClient, Tables } = require('../config/database');
const bcrypt = require('bcrypt');
const owasp = require('owasp-password-strength-test');
const validator = require('validator');
const config = require('../config/auth');
const { QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

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

    if (!password || !email || !name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // check password strength
    const strength = owasp.test(password);
    if (strength.errors.length > 0) {
      return res.status(400).json({ error: strength.errors.join(' ') });
    }

    // check if email is valid
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Fetch user from DynamoDB
    let user;
    try {
      const queryParams = {
        TableName: Tables.USERS,
        KeyConditionExpression: 'UserID = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      };

      const result = await dbClient.send(new QueryCommand(queryParams));

      if (!result.Items || result.Items.length === 0) {
        throw new Error('User not found');
      }

      user = result.Items[0];

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

      const newHashedPassword = await bcrypt.hash(
        password,
        config.password.saltRounds
      );
      const updatedPrevious = [
        { S: currentPassword },
        ...previousPasswords
      ].slice(0, PASSWORD_HISTORY_LIMIT);

      await dbClient.send(
        new UpdateItemCommand({
          TableName: Tables.USERS,
          Key: { UserID: { S: userId } },
          UpdateExpression:
            'set password = :password, previousPasswords = :previousPasswords, email = :email, name = :name',
          ExpressionAttributeValues: {
            ':password': { S: newHashedPassword },
            ':previousPasswords': { L: updatedPrevious },
            ':email': { S: email },
            ':name': { S: name }
          }
        })
      );

      return res
        .status(200)
        .json({ message: 'Details updated successfully.' });
    } catch (error) {
      console.error('Error updating details:', error);
      return res.status(500).json({ error: 'Failed to update details.' });
    }
  }
};

module.exports = userController;
