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
