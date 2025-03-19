/**
 * Test utilities for the backend tests
 */

/**
 * Creates a mock request object
 * @param {Object} options - Options for the request
 * @param {Object} options.body - Request body
 * @param {Object} options.params - Request params
 * @param {Object} options.query - Request query
 * @param {Object} options.headers - Request headers
 * @param {Object} options.user - Authenticated user (for protected routes)
 * @returns {Object} Mock request object
 */
const mockRequest = (options = {}) => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    user = null
  } = options;
  return {
    body,
    params,
    query,
    headers,
    user
  };
};

/**
 * Creates a mock response object
 * @returns {Object} Mock response object with jest functions
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Creates a valid test user object
 * @param {Object} overrides - Properties to override in the default user
 * @returns {Object} Test user object
 */
const createTestUser = (overrides = {}) => {
  return {
    email: 'test@example.com',
    password: 'Test1234!',
    name: 'Test User',
    ...overrides
  };
};

/**
 * Creates a mock JWT token
 * @param {Object} payload - Token payload
 * @returns {string} Mock JWT token
 */
const createMockToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };

  return `mock-token-${JSON.stringify({ ...defaultPayload, ...payload })}`;
};

module.exports = {
  mockRequest,
  mockResponse,
  createTestUser,
  createMockToken
};
