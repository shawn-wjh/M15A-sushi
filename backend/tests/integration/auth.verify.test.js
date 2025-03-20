const request = require('supertest');
const app = require('../../src/app');
const { generateValidToken, generateExpiredToken, generateInvalidToken, generateMalformedToken } = require('../unit/token-utils');

// Mock a protected route for testing
// Note: This assumes you have an invoice route that is protected

describe('Authentication Verification Integration Tests', () => {
  let validToken;
  let expiredToken;
  let invalidToken;
  let malformedToken;

  beforeAll(() => {
    // Generate tokens for testing
    validToken = generateValidToken();
    expiredToken = generateExpiredToken();
    invalidToken = generateInvalidToken();
    malformedToken = generateMalformedToken();
  });

  describe('Protected Invoice Routes', () => {
    test('Should allow access with valid token', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).not.toBe(401);
      // We don't assert the exact status code because it could be 200, 404, etc.
      // depending on if the user has invoices, but it shouldn't be 401
    });

    test('Should deny access with no token', async () => {
      const response = await request(app)
        .get('/v1/invoices/list');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'No authentication token provided'
      });
    });

    test('Should deny access with expired token', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Authentication token has expired'
      });
    });

    test('Should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Authorization', `Bearer ${invalidToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid authentication token'
      });
    });

    test('Should deny access with malformed token', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Authorization', `Bearer ${malformedToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid authentication token'
      });
    });
  });

  describe('Cookies Authentication', () => {
    test('Should accept valid token in cookie', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Cookie', `token=${validToken}`);
      
      expect(response.status).not.toBe(401);
    });

    test('Should reject expired token in cookie', async () => {
      const response = await request(app)
        .get('/v1/invoices/list')
        .set('Cookie', `token=${expiredToken}`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('Invoice Creation Protection', () => {
    const testInvoice = {
      invoiceId: 'TEST-' + Date.now(),
      buyer: 'Test Buyer',
      supplier: 'Test Supplier',
      issueDate: new Date().toISOString().split('T')[0],
      total: 100,
      items: [
        {
          name: 'Test Item',
          count: 1,
          cost: 100,
          currency: 'AUD'
        }
      ]
    };

    test('Should allow invoice creation with valid token', async () => {
      const response = await request(app)
        .post('/v1/invoices/create-and-validate')
        .set('Authorization', `Bearer ${validToken}`)
        .send(testInvoice);
      
      // It should either succeed (201) or give a validation error (400)
      // but not an auth error (401)
      expect(response.status).not.toBe(401);
    });

    test('Should deny invoice creation with invalid token', async () => {
      const response = await request(app)
        .post('/v1/invoices/create-and-validate')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(testInvoice);
      
      expect(response.status).toBe(401);
    });

    test('Should deny invoice creation with no token', async () => {
      const response = await request(app)
        .post('/v1/invoices/create-and-validate')
        .send(testInvoice);
      
      expect(response.status).toBe(401);
    });
  });
}); 