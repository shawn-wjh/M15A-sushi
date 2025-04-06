const request = require('supertest');
const express = require('express');
const mockInvoice = require('../src/middleware/mockInvoice');
const { validInvoiceXML } = require('./test-utils');

const app = express();
app.use(express.json());

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-dynamodb');

jest.mock('../src/config/database', () => {
  const mockSend = jest.fn().mockImplementation(async (command) => {
    const { validInvoiceXML } = require('./test-utils');
    if (command.constructor.name === 'QueryCommand') {
      return {
        Items: [
          {
            InvoiceID: 'test-invoice-id',
            UserID: 'test-user',
            invoice: validInvoiceXML,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return { Items: [] };
  });

  return {
    createDynamoDBClient: jest.fn().mockReturnValue({
      send: mockSend
    }),
    Tables: {
      INVOICES: 'Invoices'
    }
  };
});

jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = {
      userId: 'test-user',
      email: 'test@example.com',
      role: 'user'
    };
    next();
  }
}));

jest.mock('../src/middleware/invoice-validation', () => ({
  validateInvoiceStandardv2: jest.fn((req, res, next) => {
    req.validationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    req.status = 'success';
    req.message = 'Invoice successfully validated';
    next();
  }),
  validateInvoiceInput: jest.fn((req, res, next) => {
    next();
  })
}));

jest.mock('../src/controllers/invoice.controller', () => ({
  invoiceController: {
    createInvoice: jest.fn((req, res, next) => {
      res.status(200).json({
        invoiceId: 'test-invoice-id',
        invoice: '<Invoice>Test XML</Invoice>',
        status: 'success'
      });
    }),
    getInvoice: jest.fn((req, res, next) => {
      req.invoice = '<Invoice>Test XML</Invoice>';
      next();
    }),
    updateValidationStatus: jest.fn((req, res, next) => {
      next();
    }),
    updateInvoice: jest.fn((req, res, next) => {
      res.status(200).json({
        invoiceId: req.params.invoiceid,
        status: 'success'
      });
    }),
    deleteInvoice: jest.fn((req, res, next) => {
      res.status(500).json({
        error: 'Test error'
      });
    })
  }
}));

const v2InvoiceRoutes = require('../src/routes/v2.invoice.routes');

app.use('/v2/invoices', v2InvoiceRoutes);

const { validateInvoiceStandardv2, validateInvoiceInput } = require('../src/middleware/invoice-validation');
const { invoiceController } = require('../src/controllers/invoice.controller');

describe('POST /v2/invoices/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    validateInvoiceInput.mockImplementation((req, res, next) => {
      next();
    });
    
    invoiceController.createInvoice.mockImplementation((req, res, next) => {
      res.status(200).json({
        invoiceId: 'test-invoice-id',
        invoice: '<Invoice>Test XML</Invoice>',
        status: 'success'
      });
    });
  });

  it('should create new invoice', async () => {
    const response = await request(app)
      .post('/v2/invoices/create')
      .send(mockInvoice);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoiceId');
    expect(response.body).toHaveProperty('invoice');
  });

  it('should create new invoice with minimal required fields', async () => {
    const minimalInvoice = {
      invoiceId: 'INV001',
      issueDate: '2024-03-10',
      buyer: 'John Doe',
      supplier: 'XYZ Corp',
      total: 100,
      items: [{ name: 'Item A', count: 1, cost: 100 }]
    };

    const response = await request(app)
      .post('/v2/invoices/create')
      .send(minimalInvoice);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoiceId');
  });
});

describe('POST /v2/invoices/:invoiceid/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    invoiceController.getInvoice.mockImplementation((req, res, next) => {
      req.invoice = '<Invoice>Test XML</Invoice>';
      next();
    });
    
    validateInvoiceStandardv2.mockImplementation((req, res, next) => {
      req.validationResult = {
        valid: true,
        errors: [],
        warnings: []
      };
      req.status = 'success';
      req.message = 'Invoice successfully validated';
      next();
    });
    
    invoiceController.updateValidationStatus.mockImplementation((req, res, next) => {
      next();
    });
  });

  it('should validate a valid invoice XML', async () => {
    const response = await request(app)
      .post('/v2/invoices/test-invoice-id/validate')
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('successfully validated');
    expect(response.body).toHaveProperty('validationResult');
  });

  it('should reject invalid invoice XML', async () => {
    validateInvoiceStandardv2.mockImplementationOnce((req, res, next) => {
      req.validationResult = {
        valid: false,
        errors: ['Invalid XML structure'],
        warnings: []
      };
      req.status = 'error';
      req.message = 'Invoice validation failed';
      next();
    });

    const response = await request(app)
      .post('/v2/invoices/test-invoice-id/validate')
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('failed');
    expect(response.body).toHaveProperty('validationResult');
  });
});

describe('POST /v2/invoices/create-and-validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    validateInvoiceInput.mockImplementation((req, res, next) => {
      next();
    });
    
    invoiceController.createInvoice.mockImplementation((req, res, next) => {
      res.status(200).json({
        invoiceId: 'test-invoice-id',
        invoice: '<Invoice>Test XML</Invoice>',
        status: 'success'
      });
    });
    
    validateInvoiceStandardv2.mockImplementation((req, res, next) => {
      req.validationResult = {
        valid: true,
        errors: [],
        warnings: []
      };
      next();
    });
  });

  it('should create and validate a new invoice', async () => {
    const response = await request(app)
      .post('/v2/invoices/create-and-validate')
      .send({ invoice: mockInvoice, schemas: ['peppol'] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('invoiceId');
    expect(response.body).toHaveProperty('invoice');
    expect(response.body).toHaveProperty('validation');
    expect(response.body.validation).toHaveProperty('status', 'success');
    expect(response.body.validation).toHaveProperty('message');
    expect(response.body.validation.message).toContain('validated');
    expect(response.body.validation).toHaveProperty('appliedStandards');
    expect(response.body.validation).toHaveProperty('warnings');
  });

  it('should reject invalid invoice input during create-and-validate', async () => {
    validateInvoiceInput.mockImplementationOnce((req, res, next) => {
      res.status(400).json({
        error: 'Invalid invoice input'
      });
    });

    const response = await request(app)
      .post('/v2/invoices/create-and-validate')
      .send({});

    expect(response.status).toBe(400);
  });

  it('should handle validation failure during create-and-validate', async () => {
    validateInvoiceStandardv2.mockImplementationOnce((req, res, next) => {
      req.validationResult = {
        valid: false,
        errors: ['Invalid XML structure'],
        warnings: ['Warning about missing field']
      };
      next();
    });

    const response = await request(app)
      .post('/v2/invoices/create-and-validate')
      .send(mockInvoice);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Invoice validation failed');
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('validationWarnings');
    expect(response.body).toHaveProperty('appliedStandards');
    expect(response.body).toHaveProperty('invoiceId');
  });

  it('should use default validation schema when none specified', async () => {
    const response = await request(app)
      .post('/v2/invoices/create-and-validate')
      .send(mockInvoice);

    expect(response.status).toBe(200);
    expect(response.body.validation.appliedStandards).toContain('peppol');
  });

  it('should use specified validation schemas', async () => {
    const customSchemas = ['peppol', 'custom-schema'];
    
    const response = await request(app)
      .post('/v2/invoices/create-and-validate')
      .send({
        ...mockInvoice,
        schemas: customSchemas
      });

    expect(response.status).toBe(200);
    expect(response.body.validation.appliedStandards).toEqual(customSchemas);
  });
});