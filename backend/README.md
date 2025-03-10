# Local DynamoDB Testing Guide

This guide explains how to set up and use local DynamoDB for testing your authentication flow without needing AWS credentials.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Docker](https://www.docker.com/get-started) (for running DynamoDB Local)

## Setup Steps

### 1. Start DynamoDB Local with Docker

```bash
# Run DynamoDB Local in a Docker container
docker run -d -p 8000:8000 amazon/dynamodb-local

# Check if it's running
docker ps
```

### 2. Create Local DynamoDB Tables

```bash
# Run the setup script to create necessary tables
cd backend
npm run setup-local-db
```

### 3. Start the Backend with Local DynamoDB

```bash
# Start the server with local DynamoDB configuration
npm run local-db

# Alternatively, run setup and start in one command
npm run dev-with-db
```

## Testing Authentication Flow

### Backend API Endpoints

- **Register**: `POST http://localhost:3000/api/auth/register`
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "securePassword123"
  }
  ```

- **Login**: `POST http://localhost:3000/api/auth/login`
  ```json
  {
    "email": "test@example.com",
    "password": "securePassword123"
  }
  ```

### Using the Frontend Test Component

1. Start your frontend server
2. Navigate to the Auth component
3. Register a new user
4. Try logging in
5. Check localStorage to see the JWT token

## How It Works

1. The `USE_LOCAL_DYNAMODB=true` environment variable tells the app to use local DynamoDB
2. In development mode, it uses:
   - Endpoint: `http://localhost:8000`
   - Region: `localhost`
   - Fake credentials: `fakeAccessKeyId` and `fakeSecretAccessKey`
3. Tables are created with the same structure as production tables

## Troubleshooting

- **Tables not found**: Run `npm run setup-local-db` to create tables
- **Connection refused**: Make sure Docker container is running
- **Authentication errors**: Check that you're using `npm run local-db` to start the server

## Benefits

- Test full authentication flow with JWT and localStorage
- No AWS costs or AWS account required
- Works offline
- Safe testing environment (doesn't affect production data) 