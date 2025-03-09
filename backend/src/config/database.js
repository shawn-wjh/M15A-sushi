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

  // Add local endpoint for development and testing
  if (config.dynamodb.endpoint) {
    clientConfig.endpoint = config.dynamodb.endpoint;
  }

  const client = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(client);
};

// Table names with environment prefixes
const Tables = {
  INVOICES: `${config.dynamodb.tablePrefix}invoices`,
  USERS: `${config.dynamodb.tablePrefix}users`,
  TEMPLATES: `${config.dynamodb.tablePrefix}templates`
};

module.exports = {
  createDynamoDBClient,
  Tables
};
