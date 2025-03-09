const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const config = require('./index');

const createDynamoDBClient = () => {
  const clientConfig = {
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.credentials.accessKeyId,
      secretAccessKey: config.aws.credentials.secretAccessKey
    }
  };

    // Add local endpoint for development and testing if specified
    if (config.dynamodb.endpoint) {
        clientConfig.endpoint = config.dynamodb.endpoint;
    }

  const client = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(client);
};

// Direct table names without prefixes
const Tables = {
    INVOICES: config.dynamodb.invoicesTable,
    USERS: config.dynamodb.usersTable
};

module.exports = {
  createDynamoDBClient,
  Tables
};
