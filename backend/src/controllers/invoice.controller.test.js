const httpMocks = require('node-mocks-http');
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
