const request = require('supertest');
const mockInvoice = require('../src/middleware/mockInvoice');
const app = require('../src/app');
const { DOMParser } = require('xmldom');

// jest.mock('@aws-sdk/client-s3');
// jest.mock('@aws-sdk/lib-dynamodb');
// jest.mock('@aws-sdk/client-dynamodb');

describe('POST /v1/invoices', () => {
  it('should create new invoice', async () => {
      const response = await request(app)
          .post('/v1/invoices')
          .send(mockInvoice);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invoiceId');
  });

  it('should reject invalid invoice input', async () => {
    const response = await request(app)
      .post('/v1/invoices')
      .send({});

    expect(response.status).toBe(400);
  });

  // more tests done in middleware and controller test files.
});

describe('GET /v1/invoices/:invoiceid', () => {
  // add user authentication tests 

  it('should return 200 when getting an existing invoice', async () => {
    const createRes = await request(app).post('/v1/invoices').send(mockInvoice);
    const getRes = await request(app).get(`/v1/invoices/${createRes.body.invoiceId}`).send();
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('application/xml');
    expect(getRes.text).toBeTruthy();
  });

  it('should return XML with all expected invoice fields and values', async () => {
    const createRes = await request(app).post('/v1/invoices').send(mockInvoice);
    const getRes = await request(app).get(`/v1/invoices/${createRes.body.invoiceId}`).send();
    
    // Parse XML for detailed validation
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(getRes.text, "text/xml");
    
    // Helper function to get text content of an element
    const getElementText = (tagName, index = 0) => {
      const elements = xmlDoc.getElementsByTagName(tagName);
      return elements.length > index ? elements[index].textContent : null;
    };
    
    // Check invoice header information
    expect(getElementText('cbc:ID')).toBe(mockInvoice.invoiceId);
    expect(getElementText('cbc:IssueDate')).toBe(mockInvoice.issueDate);
    expect(getElementText('cbc:DueDate')).toBe(mockInvoice.dueDate);
    expect(getElementText('cbc:InvoiceTypeCode')).toBe('380');
    
    // Check supplier information
    const supplierName = xmlDoc.getElementsByTagName('cac:AccountingSupplierParty')[0]
      .getElementsByTagName('cbc:Name')[0].textContent;
    expect(supplierName).toBe(mockInvoice.supplier);
    
    // Check buyer information
    const buyerName = xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0]
      .getElementsByTagName('cbc:Name')[0].textContent;
    expect(buyerName).toBe(mockInvoice.buyer);
    
    // Check buyer address
    const buyerStreet = xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0]
      .getElementsByTagName('cbc:StreetName')[0].textContent;
    expect(buyerStreet).toBe(mockInvoice.buyerAddress.street);
    
    const buyerCountry = xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0]
      .getElementsByTagName('cbc:IdentificationCode')[0].textContent;
    expect(buyerCountry).toBe(mockInvoice.buyerAddress.country);
    
    // Check buyer phone
    const buyerPhone = xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0]
      .getElementsByTagName('cbc:Telephone')[0].textContent;
    expect(buyerPhone).toBe(mockInvoice.buyerPhone);
    
    // Check total amount
    const totalAmount = xmlDoc.getElementsByTagName('cbc:PayableAmount')[0];
    expect(totalAmount.textContent).toBe(mockInvoice.total.toString());
    expect(totalAmount.getAttribute('currencyID')).toBe(mockInvoice.currency);
    
    // Check line items
    const invoiceLines = xmlDoc.getElementsByTagName('cac:InvoiceLine');
    expect(invoiceLines.length).toBe(mockInvoice.items.length);
    
    // Check first item
    const firstItem = invoiceLines[0];
    expect(firstItem.getElementsByTagName('cbc:ID')[0].textContent).toBe('1');
    expect(firstItem.getElementsByTagName('cbc:Name')[0].textContent).toBe(mockInvoice.items[0].name);
    
    const firstItemPrice = firstItem.getElementsByTagName('cbc:PriceAmount')[0];
    expect(firstItemPrice.textContent).toBe(mockInvoice.items[0].cost.toString());
    expect(firstItemPrice.getAttribute('currencyID')).toBe(mockInvoice.items[0].currency);
    
    const firstItemQuantity = firstItem.getElementsByTagName('cbc:BaseQuantity')[0];
    expect(firstItemQuantity.textContent).toBe(mockInvoice.items[0].count.toString());
    
    // Check second item
    const secondItem = invoiceLines[1];
    expect(secondItem.getElementsByTagName('cbc:ID')[0].textContent).toBe('2');
    expect(secondItem.getElementsByTagName('cbc:Name')[0].textContent).toBe(mockInvoice.items[1].name);
    
    const secondItemPrice = secondItem.getElementsByTagName('cbc:PriceAmount')[0];
    expect(secondItemPrice.textContent).toBe(mockInvoice.items[1].cost.toString());
    expect(secondItemPrice.getAttribute('currencyID')).toBe(mockInvoice.items[1].currency);
    
    const secondItemQuantity = secondItem.getElementsByTagName('cbc:BaseQuantity')[0];
    expect(secondItemQuantity.textContent).toBe(mockInvoice.items[1].count.toString());
  });

  it('should return 400 when given an empty invoiceId', async () => {
    const res = await request(app).get(`/v1/invoices/${undefined}`).send();

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when given an invalid invoiceId', async () => {
    const res = await request(app).get(`/v1/invoices/${'invalid'}`).send();

    expect(res.statusCode).toBe(400);
  });
});


describe('PUT /v1/invoices/:invoiceid', () => {
  it('should update an existing invoice', async () => {
    // First create an invoice
    const createRes = await request(app)
      .post(`/v1/invoices`)
      .send(mockInvoice);

    console.log('createRes.body: ', createRes.body);
    
    // Prepare updated data
    const updatedInvoice = {
      ...mockInvoice,
      total: 200,
      items: [
        {
          name: 'Updated Item A',
          count: 3,
          cost: 150,
          currency: 'AUD'
        },
        {
          name: 'Updated Item B',
          count: 1,
          cost: 50,
          currency: 'AUD'
        }
      ]
    };

    // Update the invoice
    const updateRes = await request(app)
      .put(`/v1/invoices/${createRes.body.invoiceId}`)
      .send(updatedInvoice);

    // console.log('udpateRes: ', updateRes);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty('invoiceId');
    expect(updateRes.body.status).toBe('success');

    // Verify the update by getting the invoice
    const getRes = await request(app)
      .get(`/v1/invoices/${createRes.body.invoiceId}`)
      .send();

    expect(getRes.status).toBe(200);
    
    // Parse XML to verify updated values
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(getRes.text, "text/xml");
    
    // Check updated total amount
    const totalAmount = xmlDoc.getElementsByTagName('cbc:PayableAmount')[0];
    expect(totalAmount.textContent).toBe(updatedInvoice.total.toString());
    
    // Check updated items
    const invoiceLines = xmlDoc.getElementsByTagName('cac:InvoiceLine');
    expect(invoiceLines.length).toBe(updatedInvoice.items.length);
    
    // Check first updated item
    const firstItem = invoiceLines[0];
    expect(firstItem.getElementsByTagName('cbc:Name')[0].textContent)
      .toBe(updatedInvoice.items[0].name);
    expect(firstItem.getElementsByTagName('cbc:PriceAmount')[0].textContent)
      .toBe(updatedInvoice.items[0].cost.toString());
    expect(firstItem.getElementsByTagName('cbc:BaseQuantity')[0].textContent)
      .toBe(updatedInvoice.items[0].count.toString());
  });

  it('should return 400 when updating non-existent invoice', async () => {
    const res = await request(app)
      .put('/v1/invoices/invalid-id')
      .send(mockInvoice);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when invoice ID is not provided', async () => {
    const res = await request(app)
      .put('/v1/invoices/${undefined}')
      .send(mockInvoice);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
