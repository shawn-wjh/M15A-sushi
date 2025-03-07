const { 
    createInvoice,
    validateInvoice,
    listInvoices,
    getInvoice,
    // downloadInvoice,
    updateInvoice,
    deleteInvoice 
} = require('../controllers/invoice.controller');
const httpMocks = require('node-mocks-http');
const mockInvoice = require('../middleware/mockInvoice')

describe('createInvoice', () => {
    it('should return 200 when creating a new invoice', async () => {
        const request = httpMocks.createRequest({
            body: mockInvoice
        });
        const response = httpMocks.createResponse();
        await createInvoice(request, response);
        expect(response.statusCode).toBe(200);
    });

    // add tests using getInvoice to check if the invoice was created
});