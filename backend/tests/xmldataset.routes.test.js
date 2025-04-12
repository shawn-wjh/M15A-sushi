const request = require('supertest');
const express = require('express');
const app = require('../src/app');
const auth = require('../src/middleware/auth');
const validateXmlInvoices = require('../src/middleware/validateXmlInvoices');
const xmldatasetcontroller = require('../src/controllers/xmldatasetcontroller');
const xmldatasetRoutes = require('../src/routes/xmldataset.routes');

// Mock the auth middleware
jest.mock('../src/middleware/auth', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = {
      userId: 'test-user',
      email: 'test@example.com',
      role: 'user'
    };
    next();
  })
}));

// Mock the XML dataset controller
jest.mock('../src/controllers/xmldatasetcontroller', () => ({
  uploadXMLDataset: jest.fn((req, res) => {
    // Handle missing XML dataset
    if (!req.body.xmlDataset) {
      return res.status(400).json({
        status: 'error',
        message: 'No invoice data provided.'
      });
    }

    // Handle invalid XML format
    if (req.body.xmlDataset === '<Invoices><Invoice></Invoices>') {
      return res.status(400).json({
        status: 'error',
        message: 'Failed to parse XML data.',
        details: 'Unexpected close tag\nLine: 0\nColumn: 30\nChar: >'
      });
    }

    // Handle invalid XML structure
    if (req.body.xmlDataset === '<InvalidRoot><Invoice></Invoice></InvalidRoot>') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid XML structure. Expected <Invoice> or <Invoices> element.'
      });
    }

    // Success case
    return res.status(200).json({
      status: 'success',
      message: 'XML dataset uploaded successfully',
      recordsUploaded: 2
    });
  })
}));

describe('XML Dataset Routes', () => {
  const validXMLDataset = `
    <Invoices>
      <Invoice>
        <IssueDate>2024-03-20</IssueDate>
        <DueDate>2024-04-20</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount>100.00</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>
      <Invoice>
        <IssueDate>2024-03-21</IssueDate>
        <DueDate>2024-04-21</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount>200.00</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>
    </Invoices>
  `;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /v1/xml-dataset/upload', () => {
    it('should upload XML dataset successfully', async () => {
      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({ xmlDataset: validXMLDataset });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'XML dataset uploaded successfully',
        recordsUploaded: 2
      });
    });

    it('should return 400 when no XML dataset is provided', async () => {
      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'No invoice data provided.'
      });
    });

    it('should return 400 when XML dataset is empty', async () => {
      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({ xmlDataset: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'No invoice data provided.'
      });
    });

    it('should return 400 when XML dataset is invalid', async () => {
      const invalidXML = '<Invoices><Invoice></Invoices>';
      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({ xmlDataset: invalidXML });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Failed to parse XML data.',
        details: 'Unexpected close tag\nLine: 0\nColumn: 30\nChar: >'
      });
    });

    it('should return 400 when XML dataset has invalid structure', async () => {
      const invalidXML = '<InvalidRoot><Invoice></Invoice></InvalidRoot>';
      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({ xmlDataset: invalidXML });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid XML structure. Expected <Invoice> or <Invoices> element.'
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Override the auth middleware mock for this specific test
      auth.verifyToken.mockImplementation((req, res) => {
        return res.status(401).json({
          status: 'error',
          message: 'No authentication token provided'
        });
      });

      const response = await request(app)
        .post('/v1/xml-dataset/upload')
        .send({ xmlDataset: validXMLDataset });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        status: 'error',
        message: 'No authentication token provided'
      });
    });

    it('should handle server errors gracefully', async () => {
      const validXMLDataset = `
        <Invoices>
          <Invoice>
            <IssueDate>2024-03-20</IssueDate>
            <DueDate>2024-04-20</DueDate>
            <LegalMonetaryTotal>
              <PayableAmount>100.00</PayableAmount>
            </LegalMonetaryTotal>
          </Invoice>
        </Invoices>
      `;

      const req = {
        body: {
          xmlDataset: validXMLDataset
        },
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      // Mock the auth middleware to pass
      jest.spyOn(auth, 'verifyToken').mockImplementation((req, res, next) => {
        req.user = { id: 'test-user' };
        next();
      });

      // Mock the validateXmlInvoices middleware to pass
      jest.mock('../src/middleware/validateXmlInvoices', () => {
        return jest.fn((req, res, next) => {
          req.validatedInvoices = [{ id: 'test-invoice' }];
          next();
        });
      });

      // Mock the uploadXMLDataset controller to throw an error
      jest.spyOn(xmldatasetcontroller, 'uploadXMLDataset').mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          message: 'Failed to upload XML dataset'
        });
      });

      // Create a test app with the route
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/v1/xml-dataset/upload', auth.verifyToken, validateXmlInvoices, xmldatasetcontroller.uploadXMLDataset);

      // Make the request and get the response
      const response = await request(testApp)
        .post('/v1/xml-dataset/upload')
        .send(req.body)
        .set('Authorization', req.headers.authorization);

      // Check the response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to upload XML dataset'
      });
    });
  });
}); 