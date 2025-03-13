const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies first, before requiring the controller
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('uuid');

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn(params => params),
  ScanCommand: jest.fn(params => params)
}));

// Create a mock send function
const mockSend = jest.fn();

// Mock the database module
jest.mock('../../src/config/database', () => ({
  createDynamoDBClient: jest.fn(() => ({
    send: mockSend
  })),
  Tables: {
    USERS: 'Sushi-Users'
  }
}));

// Now require the controller after all mocks are set up
const registrationController = require('../../src/controllers/registration.controller');

describe('Registration Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockSend.mockReset();
    
    // Mock request and response
    req = {
      body: {
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock bcrypt hash
    bcrypt.hash.mockResolvedValue('hashedPassword123');
    
    // Mock JWT sign
    jwt.sign.mockReturnValue('mockedJWTtoken');
    
    // Mock UUID
    uuidv4.mockReturnValue('mocked-uuid');
  });
  
  describe('register', () => {
    it('should return 400 if name is missing', async () => {
      // Arrange
      req.body.name = '';
      
      // Act
      await registrationController.register(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Name is required'
      });
    });
    
    it('should return 409 if user already exists', async () => {
      // Arrange
      const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
      
      // Mock scan result to return an existing user
      mockSend.mockResolvedValueOnce({
        Items: [{ email: 'test@example.com' }]
      });
      
      // Act
      await registrationController.register(req, res);
      
      // Assert
      expect(ScanCommand).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User with this email already exists'
      });
    });
    
    it('should create a new user and return 200 with token', async () => {
      // Arrange
      const { ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
      
      // Mock scan result to return no existing users
      mockSend.mockResolvedValueOnce({
        Items: []
      });
      
      // Mock successful put operation
      mockSend.mockResolvedValueOnce({});
      
      // Act
      await registrationController.register(req, res);
      
      // Assert
      expect(ScanCommand).toHaveBeenCalled();
      expect(PutCommand).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, expect.any(Number));
      expect(uuidv4).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User registered successfully',
        data: expect.objectContaining({
          userId: 'mocked-uuid',
          email: req.body.email,
          name: req.body.name,
          token: 'mockedJWTtoken'
        })
      });
    });
    
    it('should return 500 if an error occurs', async () => {
      // Arrange
      // Mock database error
      mockSend.mockRejectedValueOnce(new Error('Database error'));
      
      // Act
      await registrationController.register(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to register',
        details: 'Database error'
      });
    });
  });
}); 