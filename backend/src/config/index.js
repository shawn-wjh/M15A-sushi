const dotenv = require('dotenv');

// Load environment variables
// creates process.env object, which contains all the environment variables
dotenv.config();

// Check if using local DynamoDB
const isLocalDb = process.env.USE_LOCAL_DYNAMODB === 'true';

// Simplified configuration without environments or prefixes
const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000
  },
  aws: {
    region: isLocalDb
      ? 'localhost'
      : process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: isLocalDb
        ? 'fakeAccessKeyId'
        : process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: isLocalDb
        ? 'fakeSecretAccessKey'
        : process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  dynamodb: {
    usersTable: isLocalDb ? 'users' : process.env.DYNAMODB_USERS_TABLE,
    invoicesTable: isLocalDb ? 'invoices' : process.env.DYNAMODB_INVOICES_TABLE,
    endpoint: isLocalDb ? 'http://localhost:8000' : undefined
  },
  s3: {
    bucket: process.env.S3_BUCKET_NAME
  },
  jwt: {
    secret:
      process.env.JWT_SECRET || 'sushi-invoice-secret-key-for-development-only',
    expiresIn: process.env.JWT_EXPIRE || '24h'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173'
    ]
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    detailed: process.env.LOG_DETAILED === 'true' || false
  }
};

module.exports = config;
