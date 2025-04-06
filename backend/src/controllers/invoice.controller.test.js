const mockSend = jest.fn();
jest.mock('../config/database', () => ({
  createDynamoDBClient: () => ({
    send: mockSend
  }),
  Tables: { INVOICES: 'InvoicesTable' }
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

jest.mock('../middleware/invoice-generation', () => ({
  convertToUBL: jest.fn(() => '<Invoice>UBL XML</Invoice>')
}));

const { checkUserId } = require('../middleware/helperFunctions');
jest.mock('../middleware/helperFunctions', () => ({
  checkUserId: jest.fn(() => true)
}));


const { invoiceController, parseXMLSafely } = require('./invoice.controller');
const xml2js = require('xml2js');


const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
  set: jest.fn().mockReturnThis()
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Invoice Controller', () => {
  describe('createInvoice', () => {
    it('should return 401 if checkUserId returns false', async () => {
      checkUserId.mockReturnValueOnce(false);
      const req = {
        body: { some: 'data' },
        user: { userId: 'invalid-user' }
      };
      const res = createRes();
      await invoiceController.createInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'No user ID provided'
      });
    });

    it('should create invoice successfully', async () => {
      checkUserId.mockReturnValueOnce(true);
      mockSend.mockResolvedValueOnce({}); // Simulate PutCommand success
      const req = {
        body: { some: 'data' },
        user: { userId: 'valid-user' }
      };
      const res = createRes();
      await invoiceController.createInvoice(req, res);
      expect(mockSend).toHaveBeenCalled(); // PutCommand was sent
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Invoice created successfully',
        invoiceId: 'test-uuid',
        invoice: '<Invoice>UBL XML</Invoice>'
      });
    });

    it('should return 500 if PutCommand fails in createInvoice', async () => {
      checkUserId.mockReturnValueOnce(true);
      const error = new Error('PutCommand error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        body: { some: 'data' },
        user: { userId: 'valid-user' }
      };
      const res = createRes();
      await invoiceController.createInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to create invoice',
        details: 'PutCommand error'
      });
    });
  });

  describe('listInvoices', () => {
    it('should return error for invalid limit (outer block)', async () => {
      // Use a negative limit so that parseInt returns -1 and outer block catches it.
      const req = {
        query: { limit: '-1', offset: '0' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'limit must be greater than 0'
      });
    });

    it('should return error for invalid offset (outer block)', async () => {
      const req = {
        query: { limit: '10', offset: '-5' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'offset must be at least 0'
      });
    });

    it('should return error for invalid sort field', async () => {
      const req = {
        query: { limit: '10', offset: '0', sort: 'invalid', order: 'asc' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'invalid sort query'
      });
    });

    it('should return error for invalid order query', async () => {
      const req = {
        query: { limit: '10', offset: '0', sort: 'issuedate', order: 'invalid' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'invalid order query'
      });
    });

    it('should return 500 if db scan fails', async () => {
      const error = new Error('db scan error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        query: { limit: '10', offset: '0' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Failed to list invoices',
        details: 'db scan error'
      });
    });

    it('should list invoices with proper pagination and sorting (issuedate)', async () => {
      const validInvoiceXML = `<Invoice>
        <IssueDate>2025-01-01</IssueDate>
        <DueDate>2025-01-15</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount>100</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>`;
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            InvoiceID: '1',
            UserID: 'user1',
            invoice: validInvoiceXML,
            timestamp: '2025-01-01T00:00:00.000Z'
          },
          {
            InvoiceID: '2',
            UserID: 'user1',
            invoice: validInvoiceXML,
            timestamp: '2025-01-02T00:00:00.000Z'
          }
        ]
      });
      const req = {
        query: { limit: '1', offset: '0', sort: 'issuedate', order: 'asc' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.status).toBe('success');
      expect(jsonResponse.data.count).toBe(2);
      expect(jsonResponse.data.invoices.length).toBe(1);
      // Verify that the temporary "parsedData" is removed
      expect(jsonResponse.data.invoices[0]).not.toHaveProperty('parsedData');
    });

    it('should adjust offset when offset > total invoices', async () => {
      // Only one invoice exists, but offset is provided greater than count.
      const validInvoiceXML = `<Invoice>
        <IssueDate>2025-01-01</IssueDate>
        <DueDate>2025-01-15</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount>100</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>`;
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            InvoiceID: '1',
            UserID: 'user1',
            invoice: validInvoiceXML,
            timestamp: '2025-01-01T00:00:00.000Z'
          }
        ]
      });
      // Provide offset higher than total items (1) with limit 5.
      const req = {
        query: { limit: '5', offset: '10' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.data.count).toBe(1);
      expect(jsonResponse.data.invoices.length).toBe(1);
    });

    it('should sort invoices by total (ascending and descending)', async () => {
      // Create two invoices with TotalPayableAmount as an object with "_" property.
      const xmlWithAttributes1 = `<Invoice>
        <IssueDate>2025-01-01</IssueDate>
        <DueDate>2025-01-15</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount attr="x">100</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>`;
      const xmlWithAttributes2 = `<Invoice>
        <IssueDate>2025-01-02</IssueDate>
        <DueDate>2025-01-16</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount attr="x">50</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>`;
      const items = [
        {
          InvoiceID: '1',
          UserID: 'user1',
          invoice: xmlWithAttributes1,
          timestamp: '2025-01-01T00:00:00.000Z'
        },
        {
          InvoiceID: '2',
          UserID: 'user1',
          invoice: xmlWithAttributes2,
          timestamp: '2025-01-02T00:00:00.000Z'
        }
      ];
      // For ascending order
      mockSend.mockResolvedValueOnce({ Items: items });
      const reqAsc = {
        query: { limit: '10', offset: '0', sort: 'total', order: 'asc' },
        user: { userId: 'user1' }
      };
      const resAsc = createRes();
      await invoiceController.listInvoices(reqAsc, resAsc);
      const ascResponse = resAsc.json.mock.calls[0][0];
      expect(ascResponse.data.invoices[0].InvoiceID).toBe('2');

      // For descending order, set the mock response again.
      mockSend.mockResolvedValueOnce({ Items: items });
      const reqDesc = {
        query: { limit: '10', offset: '0', sort: 'total', order: 'desc' },
        user: { userId: 'user1' }
      };
      const resDesc = createRes();
      await invoiceController.listInvoices(reqDesc, resDesc);
      const descResponse = resDesc.json.mock.calls[0][0];
      expect(descResponse.data.invoices[0].InvoiceID).toBe('1');
    });

    // --- Extra tests to cover inner block validations using parseInt spying ---

    it('should return error from inner block if limit < 1 (inner block override)', async () => {
      // Here we force the outer block to see a valid limit, then inside try force an invalid limit.
      const originalParseInt = global.parseInt;
      const spy = jest.spyOn(global, 'parseInt')
        // Outer block: for req.query.limit "-1", return 10 (valid)
        .mockImplementationOnce((val, base) => (val === "-1" ? 10 : originalParseInt(val, base)))
        // Outer block: for offset "0", return 1 (valid)
        .mockImplementationOnce((val, base) => (val === "0" ? 1 : originalParseInt(val, base)))
        // Inner block: for limit "-1", return -1 (invalid)
        .mockImplementationOnce((val, base) => (val === "-1" ? -1 : originalParseInt(val, base)))
        // Inner block: for offset "0", return 1 (valid)
        .mockImplementationOnce((val, base) => (val === "0" ? 1 : originalParseInt(val, base)));
      
      const req = {
        query: { limit: "-1", offset: "0" },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'limit must be greater than 0'
      });
      spy.mockRestore();
    });

    it('should return error from inner block if offset < 0 (inner block override)', async () => {
      // Force outer block to have valid values, then inner block returns invalid offset.
      const originalParseInt = global.parseInt;
      const spy = jest.spyOn(global, 'parseInt')
        // Outer block: for limit "10", return 10 (valid)
        .mockImplementationOnce((val, base) => (val === "10" ? 10 : originalParseInt(val, base)))
        // Outer block: for offset "0", return 1 (valid)
        .mockImplementationOnce((val, base) => (val === "0" ? 1 : originalParseInt(val, base)))
        // Inner block: for limit "10", return 10 (valid)
        .mockImplementationOnce((val, base) => (val === "10" ? 10 : originalParseInt(val, base)))
        // Inner block: for offset "0", return -1 (invalid)
        .mockImplementationOnce((val, base) => (val === "0" ? -1 : originalParseInt(val, base)));
      
      const req = {
        query: { limit: "10", offset: "0" },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.listInvoices(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'offset must be at least 0'
      });
      spy.mockRestore();
    });
  });

  describe('getInvoice', () => {
    it('should throw an error if invoice ID is missing', async () => {
      const req = {
        params: {},
        user: { userId: 'user1' }
      };
      const res = createRes();
      await expect(invoiceController.getInvoice(req, res)).rejects.toThrow('Missing invoice ID');
    });

    it('should return error if invoice not found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const req = {
        params: { invoiceid: 'nonexistent' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.getInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Invoice not found'
      });
    });

    

    it('should return invoice XML if authorized', async () => {
      checkUserId.mockReturnValueOnce(true);
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1',
          invoice: '<Invoice>UBL XML</Invoice>'
        }]
      });
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.getInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/xml');
      expect(res.send).toHaveBeenCalledWith('<Invoice>UBL XML</Invoice>');
    });

    it('should call next if provided', async () => {
      checkUserId.mockReturnValueOnce(true);
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1',
          invoice: '<Invoice>UBL XML</Invoice>'
        }]
      });
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' },
        body: {}
      };
      const res = createRes();
      const next = jest.fn();
      await invoiceController.getInvoice(req, res, next);
      expect(req.body.xml).toEqual('<Invoice>UBL XML</Invoice>');
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 if db query fails in getInvoice', async () => {
      const error = new Error('db query error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.getInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'db query error'
      });
    });
  });

  describe('updateInvoice', () => {
    it('should return error if invoice ID is missing', async () => {
      const req = {
        params: {},
        body: { some: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Missing invoice ID'
      });
    });

    it('should return error if invoice not found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const req = {
        params: { invoiceid: 'invoice-1' },
        body: { some: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Invoice not found'
      });
    });

    it('should return error if unauthorized', async () => {
      checkUserId.mockReturnValueOnce(false);
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'otherUser',
          invoice: '<Invoice>UBL XML</Invoice>'
        }]
      });
      const req = {
        params: { invoiceid: 'invoice-1' },
        body: { some: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Unauthorised Access'
      });
    });

    it('should update invoice successfully', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1',
          invoice: '<Invoice>Old XML</Invoice>'
        }]
      });
      mockSend.mockResolvedValueOnce({}); // Simulate PutCommand success
      const req = {
        params: { invoiceid: 'invoice-1' },
        body: { updated: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Invoice updated successfully',
        invoiceId: 'invoice-1'
      });
    });

    it('should return 400 if db query fails in updateInvoice', async () => {
      const error = new Error('db query error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        params: { invoiceid: 'invoice-1' },
        body: { updated: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'db query error'
      });
    });

    it('should return 400 if PutCommand fails in updateInvoice', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1',
          invoice: '<Invoice>Old XML</Invoice>'
        }]
      });
      const error = new Error('PutCommand error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        params: { invoiceid: 'invoice-1' },
        body: { updated: 'data' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.updateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'PutCommand error'
      });
    });
  });

  describe('deleteInvoice', () => {
    it('should return error if invoice ID is missing', async () => {
      const req = {
        params: {},
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Missing invoice ID'
      });
    });

    it('should return error if invoice not found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Invoice not found'
      });
    });

    it('should return 401 if unauthorized', async () => {
      checkUserId.mockReturnValueOnce(false);
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'otherUser'
        }]
      });
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Unauthorised Access'
      });
    });

    it('should delete invoice successfully', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1'
        }]
      });
      mockSend.mockResolvedValueOnce({}); // Simulate DeleteCommand success
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Invoice deleted successfully'
      });
    });

    it('should return 500 if db query fails in deleteInvoice', async () => {
      const error = new Error('db query error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'db query error'
      });
    });

    it('should return 500 if DeleteCommand fails in deleteInvoice', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{
          InvoiceID: 'invoice-1',
          UserID: 'user1'
        }]
      });
      const error = new Error('DeleteCommand error');
      mockSend.mockRejectedValueOnce(error);
      const req = {
        params: { invoiceid: 'invoice-1' },
        user: { userId: 'user1' }
      };
      const res = createRes();
      await invoiceController.deleteInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'DeleteCommand error'
      });
    });
  });

  describe('updateValidationStatus', () => {
    it('should return error if invoice ID or valid status is missing', async () => {
      const req = {
        params: {},
        validationResult: {} // missing valid field
      };
      const res = createRes();
      await invoiceController.updateValidationStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Missing invoice ID or valid status'
      });
    });
    
  });

  describe('parseXMLSafely', () => {
    it('should parse valid XML and return expected object', async () => {
      const xmlString = `<Invoice>
        <IssueDate>2025-01-01</IssueDate>
        <DueDate>2025-01-15</DueDate>
        <LegalMonetaryTotal>
          <PayableAmount>100</PayableAmount>
        </LegalMonetaryTotal>
      </Invoice>`;
      const result = await parseXMLSafely(xmlString);
      expect(result).toEqual({
        IssueDate: '2025-01-01',
        DueDate: '2025-01-15',
        TotalPayableAmount: '100'
      });
    });

    it('should return null for invalid XML input (non-string)', async () => {
      const result = await parseXMLSafely(null);
      expect(result).toBeNull();
    });

    it('should return default null values when Invoice element is absent', async () => {
      const xmlString = `<Invalid></Invalid>`;
      const result = await parseXMLSafely(xmlString);
      expect(result).toEqual({
        IssueDate: null,
        DueDate: null,
        TotalPayableAmount: null
      });
    });

    it('should catch errors thrown by the XML parser and return null', async () => {
      // Spy on parseStringPromise and force it to throw an error
      const parserSpy = jest.spyOn(xml2js.Parser.prototype, 'parseStringPromise')
        .mockRejectedValueOnce(new Error('Parser error'));
      const xmlString = `<Invoice><DueDate>2025-01-15</DueDate>`; // malformed XML
      const result = await parseXMLSafely(xmlString);
      expect(result).toBeNull();
      parserSpy.mockRestore();
    });
  });
  it('should return error for invalid sort query in inner block override', async () => {
    let sortCallCount = 0;
    const req = {
      query: {
        limit: "10",
        offset: "0",
        // First read returns a valid value; second read returns an invalid value.
        get sort() {
          sortCallCount++;
          return sortCallCount === 1 ? "issuedate" : "invalid";
        },
        order: "asc"
      },
      user: { userId: 'user1' }
    };
    const res = createRes();
    await invoiceController.listInvoices(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'invalid sort query'
    });
  });

  it('should return error for invalid order query in inner block override', async () => {
    let orderCallCount = 0;
    const req = {
      query: {
        limit: "10",
        offset: "0",
        sort: "issuedate",
        // First read returns a valid value; second read returns an invalid value.
        get order() {
          orderCallCount++;
          return orderCallCount === 1 ? "asc" : "invalid";
        }
      },
      user: { userId: 'user1' }
    };
    const res = createRes();
    await invoiceController.listInvoices(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'invalid order query'
    });
  });
  
  
});