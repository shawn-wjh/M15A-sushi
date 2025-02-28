const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default configurations
const defaultConfig = {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
    },
    aws: {
        region: process.env.AWS_REGION || 'ap-southeast-2',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    },
    dynamodb: {
        tablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'invoice_system_',
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRE || '24h',
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    },
    storage: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
    }
};

// Environment-specific configurations
const environmentConfigs = {
    development: {
        dynamodb: {
            endpoint: 'http://localhost:8000', // Local DynamoDB endpoint
            tablePrefix: 'dev_' + defaultConfig.dynamodb.tablePrefix,
        },
        logging: {
            level: 'debug',
            detailed: true
        }
    },
    production: {
        dynamodb: {
            // Uses default AWS endpoint
            tablePrefix: 'prod_' + defaultConfig.dynamodb.tablePrefix,
        },
        logging: {
            level: 'info',
            detailed: false
        }
    },
    test: {
        dynamodb: {
            endpoint: 'http://localhost:8000',
            tablePrefix: 'test_' + defaultConfig.dynamodb.tablePrefix,
        },
        logging: {
            level: 'debug',
            detailed: true
        }
    }
};

// Merge default config with environment-specific config
const currentEnv = process.env.NODE_ENV || 'development';
const envConfig = environmentConfigs[currentEnv] || environmentConfigs.development;

const config = {
    ...defaultConfig,
    ...envConfig,
    // Preserve nested objects
    dynamodb: {
        ...defaultConfig.dynamodb,
        ...envConfig.dynamodb
    }
};

module.exports = config; 