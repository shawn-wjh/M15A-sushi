const httpMocks = require('node-mocks-http');
const { validateInvoiceInput } = require('./invoice-validation');
const mockInvoice = require('./mockInvoice');

describe('Invoice Validation Middleware', () => {
  it('should pass validation with a valid invoice', () => {
    const req = httpMocks.createRequest({ body: mockInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // Test required fields
  it.each([
    [{ ...mockInvoice, invoiceId: undefined }, 'invoiceId'],
    [{ ...mockInvoice, buyer: undefined }, 'buyer'],
    [{ ...mockInvoice, supplier: undefined }, 'supplier'],
    [{ ...mockInvoice, issueDate: undefined }, 'issueDate'],
    [{ ...mockInvoice, total: undefined }, 'total'],
    [{ ...mockInvoice, items: undefined }, 'items']
  ])('should fail validation when %s is missing', (invalidInvoice, fieldName) => {
    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
    expect(res._getData()).toContain(fieldName);
  });

  // Test optional fields - these should not cause validation failures
  it.each([
    [{ ...mockInvoice, dueDate: undefined }, 'dueDate'],
    [{ ...mockInvoice, currency: undefined }, 'currency'],
    [{ ...mockInvoice, buyerAddress: undefined }, 'buyerAddress'],
    [{ ...mockInvoice, supplierAddress: undefined }, 'supplierAddress'],
    [{ ...mockInvoice, buyerPhone: undefined }, 'buyerPhone']
  ])('should pass validation when optional field %s is missing', (validInvoice, fieldName) => {
    const req = httpMocks.createRequest({ body: validInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it.each([
    [{ ...mockInvoice, invoiceId: 123 }],
    [{ ...mockInvoice, total: 'string' }],
    [{ ...mockInvoice, buyer: 123 }],
    [{ ...mockInvoice, supplier: 123 }],
    [{ ...mockInvoice, issueDate: 123 }]
  ])('should fail validation if fields are of incorrect type', (invalidInvoice) => {
    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if issue date is not in YYYY-MM-DD format', () => {
    const invalidInvoice = { ...mockInvoice, issueDate: '05-03-2025' };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if issue date is after due date', () => {
    const invalidInvoice = { ...mockInvoice, issueDate: '2025-03-11' };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if issue is not valid', () => {
    const invalidInvoice = { ...mockInvoice, issueDate: '2025-13-32' };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if due is not valid', () => {
    const invalidInvoice = { ...mockInvoice, dueDate: '2024-13-32' };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if item count is less than or equal to 0', () => {
    const invalidInvoice = { 
      ...mockInvoice, 
      items: [{ ...mockInvoice.items[0], count: 0 }],
      total: 0 
    };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if invoice total does not match item costs', () => {
    const invalidInvoice = { ...mockInvoice, total: 200 };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if currency code is invalid', () => {
    const invalidInvoice = { ...mockInvoice, currency: 'INVALID' };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });

  it('should fail validation if country code is invalid', () => {
    const invalidInvoice = { 
      ...mockInvoice, 
      buyerAddress: { 
        ...mockInvoice.buyerAddress, 
        country: 'INVALID' 
      } 
    };

    const req = httpMocks.createRequest({ body: invalidInvoice });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validateInvoiceInput(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toContain('error');
  });
});
