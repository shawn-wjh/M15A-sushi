const {
  createInvoice,
  validateInvoice,
  listInvoices,
  getInvoice,
  // downloadInvoice,
  updateInvoice,
  deleteInvoice
} = require('./invoice.controller');
const mockInvoice = require('../middleware/mockInvoice');
const request = require('supertest');
const app = require('../../src/app');
const invoiceController = require('../../src/controllers/invoice.controller');
const { createDynamoDBClient, Tables } = require('../config/database');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dbClient = createDynamoDBClient();
// jest.mock('@aws-sdk/client-s3');
// jest.mock('@aws-sdk/client-dynamodb');

describe('createInvoice', () => {
  // it('should return 200 when creating a new invoice', async () => {
  //     const request = httpMocks.createRequest({
  //         body: mockInvoice
  //     });
  //     const response = httpMocks.createResponse();
  //     await createInvoice(request, response);
  //     expect(response.statusCode).toBe(200);
  // });

  it('fix the issue above', () => {
    expect(1).toBe(1);
  });
  // add tests using getInvoice to check if the invoice was created
});
jest.mock('../config/database', () => {
  const send = jest.fn();
  return {
    createDynamoDBClient: () => ({
      send
    }),
    Tables: {
      INVOICES: 'Invoices'
    }
  };
});

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}
describe('invoiceController.listInvoices', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { query: {} };
    res = createRes();

    dbClient.send.mockReset();
  });

  test('should return an empty list when no invoices exist', async () => {
    dbClient.send.mockResolvedValueOnce({ Items: [] });

    await invoiceController.listInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        count: 0,
        invoices: []
      }
    });
  });

  test('should return 400 for invalid limit (less than 1)', async () => {
    req.query.limit = '0';

    await invoiceController.listInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'limit must be greater than 0'
    });
  });

  test('should return 400 for invalid offset (less than 0)', async () => {
    req.query.offset = '-1'; // invalid offset

    await invoiceController.listInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'offset must be at least 0'
    });
  });

  test('should return 400 for invalid sort field', async () => {
    req.query.sort = 'invalidfield';

    await invoiceController.listInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'invalid sort query'
    });
  });

  test('should return 400 for invalid order query', async () => {
    req.query.order = 'invalidorder';

    await invoiceController.listInvoices(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'invalid order query'
    });
  });

  test('should return paginated and sorted invoices', async () => {
    const invoices = [
      {
        InvoiceID: '1',
        timestamp: '2025-03-15T00:00:00.000Z',
        UserID: '123',
        invoice: '<xml>1</xml>'
      },
      {
        InvoiceID: '2',
        timestamp: '2025-03-16T00:00:00.000Z',
        UserID: '123',
        invoice: '<xml>2</xml>'
      },
      {
        InvoiceID: '3',
        timestamp: '2025-03-17T00:00:00.000Z',
        UserID: '123',
        invoice: '<xml>3</xml>'
      },
      {
        InvoiceID: '4',
        timestamp: '2025-03-18T00:00:00.000Z',
        UserID: '123',
        invoice: '<xml>4</xml>'
      },
      {
        InvoiceID: '5',
        timestamp: '2025-03-19T00:00:00.000Z',
        UserID: '123',
        invoice: '<xml>5</xml>'
      }
    ];

    dbClient.send.mockResolvedValueOnce({ Items: invoices });

    req.query.limit = '2';
    req.query.offset = '10';
    req.query.sort = 'issuedate';
    req.query.order = 'asc';

    await invoiceController.listInvoices(req, res);

    const expectedInvoices = invoices.slice(3, 5);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        count: invoices.length,
        invoices: expectedInvoices
      }
    });
  });
});
// describe('getInvoice', () => {
//   it('should return 200 when getting an existing invoice', async () => {
//     const createRes = await request(app).post('/v1/invoices').send({mockInvoice});
//     const getRes = await request(app).get(`/v1/invoices/${createRes.body.invoiceId}`).send();

//     console.log(getRes.body);
//     expect(getRes.statusCode).toBe(200);
//   });

//   it('should return 400 when given an invalid invoiceId', async () => {
//     const res = request(app).get(`/v1/invoices/${undefined}`).send();

//     expect(res.statusCode).toBe(400);
//   });
// });
