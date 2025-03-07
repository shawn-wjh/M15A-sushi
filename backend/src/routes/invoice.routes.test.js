const httpMocks = require('node-mocks-http');
const mockInvoice = require('../middleware/mockInvoice')
const request = require('supertest');
const app = require('../app'); // adjust path as needed

describe('POST /v1/invoices', () => {
    test('should create new invoice', async () => {
        const response = await request(app)
            .post('/v1/invoices')
            .send(mockInvoice);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('invoiceId');
    });

    test('should reject invalid invoice input', async () => {
        const response = await request(app)
            .post('/v1/invoices')
            .send({});
        
        expect(response.status).toBe(400);
    });

    // more tests done in middleware and controller test files. 
});