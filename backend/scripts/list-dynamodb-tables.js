const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Local DynamoDB configuration
const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey'
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function listTables() {
  try {
    const { TableNames } = await client.send(new ListTablesCommand({}));
    console.log('Available tables:', TableNames);
    
    // Scan each table
    for (const tableName of TableNames) {
      console.log(`\n--- Contents of table: ${tableName} ---`);
      
      const scanParams = {
        TableName: tableName
      };
      
      const { Items } = await docClient.send(new ScanCommand(scanParams));
      
      if (Items && Items.length > 0) {
        console.log(JSON.stringify(Items, null, 2));
      } else {
        console.log('No items found in table.');
      }
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listTables(); 