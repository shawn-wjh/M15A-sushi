const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  ScanCommand: jest.fn((params) => params)
}));

// Mock bcrypt and jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Create a mock send function
const mockSend = jest.fn();

// Mock the database module
jest.mock('../config/database', () => ({
  createDynamoDBClient: jest.fn(() => ({
    send: mockSend
  })),
  Tables: {
    USERS: 'Sushi-Users'
  }
}));

// Mock auth config
jest.mock('../config/auth', () => ({
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h'
  }
}));

// require the controller after all mocks are set up
const authController = require('./auth.controller');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockSend.mockReset();

    // Mock request object
    mockReq = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('login', () => {
    it('should return 400 if email is missing', async () => {
      mockReq.body = { password: 'password123' };

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email and password are required'
      });
    });

    it('should return 400 if password is missing', async () => {
      mockReq.body = { email: 'test@example.com' };

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email and password are required'
      });
    });

    it('should return 400 if user not found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await authController.login(mockReq, mockRes);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'Sushi-Users',
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': 'test@example.com'
          }
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid credentials'
      });
    });

    it('should return 400 if password is invalid', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      mockSend.mockResolvedValueOnce({ Items: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);

      await authController.login(mockReq, mockRes);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'Sushi-Users',
          FilterExpression: 'email = :email'
        })
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword'
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid password'
      });
    });

    it('should return 200 and token on successful login', async () => {
      const mockUser = {
        UserID: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        password: 'hashedPassword'
      };

      mockSend.mockResolvedValueOnce({ Items: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce('mockToken');

      await authController.login(mockReq, mockRes);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'Sushi-Users',
          FilterExpression: 'email = :email'
        })
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword'
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.UserID,
          email: mockUser.email,
          role: mockUser.role
        },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            UserID: mockUser.UserID
          },
          token: 'mockToken'
        }
      });
    });

    it('should return 500 on server error', async () => {
      mockSend.mockRejectedValueOnce(new Error('Database error'));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Login failed',
        details: 'Database error'
      });
    });
  });
});
