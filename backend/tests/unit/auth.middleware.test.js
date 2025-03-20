const jwt = require('jsonwebtoken');
const authConfig = require('../../src/config/auth');
const auth = require('../../src/middleware/auth');
const { mockRequest, mockResponse } = require('../test-utils');

// Mock JWT
jest.mock('jsonwebtoken');

describe('Auth Middleware - verifyToken', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should pass with valid Bearer token in Authorization header', async () => {
    // Mock valid token
    const validToken = 'valid-token';
    const decodedToken = { userId: 'user123', email: 'test@example.com', role: 'user' };
    
    // Setup mock request with Authorization header
    const req = mockRequest({
      headers: { authorization: `Bearer ${validToken}` }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Setup JWT verify to return decoded token
    jwt.verify.mockReturnValue(decodedToken);

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(validToken, authConfig.jwt.secret);
    expect(req.user).toEqual({
      userId: decodedToken.userId,
      email: decodedToken.email,
      role: decodedToken.role
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should pass with valid token in cookies', async () => {
    // Mock valid token
    const validToken = 'valid-token';
    const decodedToken = { userId: 'user123', email: 'test@example.com', role: 'user' };
    
    // Setup mock request with token in cookies
    const req = mockRequest({
      cookies: { token: validToken }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Setup JWT verify to return decoded token
    jwt.verify.mockReturnValue(decodedToken);

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith(validToken, authConfig.jwt.secret);
    expect(req.user).toEqual({
      userId: decodedToken.userId,
      email: decodedToken.email,
      role: decodedToken.role
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 401 with no token provided', async () => {
    // Setup mock request with no token
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'No authentication token provided'
    });
  });

  test('should return 401 with invalid token format', async () => {
    // Setup mock request with invalid token
    const req = mockRequest({
      headers: { authorization: 'Bearer invalid-token' }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Setup JWT verify to throw error
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid authentication token'
    });
  });

  test('should return 401 with expired token', async () => {
    // Setup mock request with expired token
    const req = mockRequest({
      headers: { authorization: 'Bearer expired-token' }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Setup JWT verify to throw expired error
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication token has expired'
    });
  });

  test('should return 401 with malformed token', async () => {
    // Setup mock request with malformed token
    const req = mockRequest({
      headers: { authorization: 'Bearer malformed-token' }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Setup JWT verify to throw generic error
    const error = new Error('JWT malformed');
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    // Call middleware
    await auth.verifyToken(req, res, next);

    // Assertions
    expect(jwt.verify).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid token'
    });
  });
});

describe('Auth Middleware - isAuthenticated', () => {
  test('should pass when user is in request', async () => {
    // Setup mock request with user
    const req = mockRequest({
      user: { userId: 'user123', email: 'test@example.com', role: 'user' }
    });
    const res = mockResponse();
    const next = jest.fn();

    // Call middleware
    await auth.isAuthenticated(req, res, next);

    // Assertions
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 401 when user is not in request', async () => {
    // Setup mock request without user
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();

    // Call middleware
    await auth.isAuthenticated(req, res, next);

    // Assertions
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Not authenticated'
    });
  });

  test('should return 401 when error occurs', async () => {
    // Setup mock request that will cause an error
    const req = {
      get: () => {
        throw new Error('Test error');
      }
    };
    const res = mockResponse();
    const next = jest.fn();

    // Call middleware
    await auth.isAuthenticated(req, res, next);

    // Assertions
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Not authenticated'
    });
  });
}); 