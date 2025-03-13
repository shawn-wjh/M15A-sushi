const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// Local DynamoDB configuration
const localDbClient = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey'
  }
});

// Create Users table
const createUsersTable = async () => {
  const params = {
    TableName: 'users',
    KeySchema: [
      { AttributeName: 'UserID', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'UserID', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await localDbClient.send(new CreateTableCommand(params));
    console.log('Users table created successfully!');
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('Users table already exists');
    } else {
      console.error('Error creating Users table:', err);
    }
  }
};

// Create Invoices table
const createInvoicesTable = async () => {
  const params = {
    TableName: 'invoices',
    KeySchema: [
      { AttributeName: 'InvoiceID', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'InvoiceID', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await localDbClient.send(new CreateTableCommand(params));
    console.log('Invoices table created successfully!');
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('Invoices table already exists');
    } else {
      console.error('Error creating Invoices table:', err);
    }
  }
};

// Run the setup
const setupLocalTables = async () => {
  try {
    await createUsersTable();
    await createInvoicesTable();
    console.log('Local DynamoDB setup complete!');
  } catch (error) {
    console.error('Error setting up local DynamoDB:', error);
  }
};

setupLocalTables(); 