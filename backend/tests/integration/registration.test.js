// Mock AWS SDK modules first
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((params) => params),
  ScanCommand: jest.fn((params) => params)
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

// Mock other dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('xml-js', () => ({
  js2xml: jest.fn(),
  xml2js: jest.fn()
}));

// Now require the modules after all mocks are set up
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();

    // Mock bcrypt hash
    bcrypt.hash.mockResolvedValue('hashedPassword123');

    // Mock JWT sign
    jwt.sign.mockReturnValue('mockedJWTtoken');
  });

  describe('POST /v1/users/register', () => {
    it('should return 400 if email is missing', async () => {
      // Act
      const response = await request(app).post('/v1/users/register').send({
        password: 'Test1234!',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Email is required'
      });
    });

    it('should return 400 if password is missing', async () => {
      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Password is required'
      });
    });

    it('should return 400 if password does not meet requirements', async () => {
      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      // The exact error message will depend on which requirement fails first
    });

    it('should return 400 if name is missing', async () => {
      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        password: 'Test1234!'
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Name is required'
      });
    });

    it('should return 409 if user already exists', async () => {
      // Arrange
      // Mock scan to return an existing user
      mockSend.mockResolvedValueOnce({
        Items: [{ email: 'test@example.com' }]
      });

      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        status: 'error',
        message: 'User with this email already exists'
      });
    });

    it('should register a new user successfully', async () => {
      // Arrange
      // Mock scan to return no existing users
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      // Mock successful put operation
      mockSend.mockResolvedValueOnce({});

      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('name', 'Test User');
    });

    it('should return 500 if database operation fails', async () => {
      // Arrange
      // Mock database error
      mockSend.mockRejectedValueOnce(new Error('Database error'));

      // Act
      const response = await request(app).post('/v1/users/register').send({
        email: 'test@example.com',
        password: 'Test1234!',
        name: 'Test User'
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Failed to register');
    });
  });
});
