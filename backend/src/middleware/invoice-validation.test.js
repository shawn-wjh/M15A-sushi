const httpMocks = require('node-mocks-http');
const fs = require('fs');
const path = require('path');
const { validateInvoiceInput, validateInvoiceStandard } = require('./invoice-validation');
const mockInvoice = require('./mockInvoice');
const { error } = require('console');

// Mock dependencies
jest.mock('fs');
jest.mock('path');

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

const validXml = `
      <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
               xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
               xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
        <cbc:ID>TEST-002</cbc:ID>
        <cbc:IssueDate>2025-03-05</cbc:IssueDate>
        <cbc:DueDate>2025-03-10</cbc:DueDate>
        <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
        <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
        <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
        <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
        <cac:OrderReference>
          <cbc:ID>N/A</cbc:ID>
        </cac:OrderReference>
        <cac:InvoiceDocumentReference>
          <cbc:ID>N/A</cbc:ID>
        </cac:InvoiceDocumentReference>
        <cac:AccountingSupplierParty>
          <cac:Party>
            <cac:PartyName>
              <cbc:Name>Test Supplier</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
              <cbc:StreetName>123 Test St</cbc:StreetName>
              <cbc:CityName>Test City</cbc:CityName>
              <cbc:PostalZone>2000</cbc:PostalZone>
              <cac:Country>
                <cbc:IdentificationCode>AUS</cbc:IdentificationCode>
              </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
              <cbc:CompanyID>AU123456789</cbc:CompanyID>
              <cac:TaxScheme>
                <cbc:ID>GST</cbc:ID>
              </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
              <cbc:RegistrationName>Test Supplier Pty Ltd</cbc:RegistrationName>
              <cbc:CompanyID>123456789</cbc:CompanyID>
            </cac:PartyLegalEntity>
            <cac:Contact>
              <cbc:ElectronicMail>supplier@example.com</cbc:ElectronicMail>
            </cac:Contact>
          </cac:Party>
        </cac:AccountingSupplierParty>
        
        <cac:AccountingCustomerParty>
          <cac:Party>
            <cac:PartyName>
              <cbc:Name>Test Buyer</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
              <cbc:StreetName>123 Test St</cbc:StreetName>
              <cbc:CityName>Test City</cbc:CityName>
              <cbc:PostalZone>2000</cbc:PostalZone>
              <cac:Country>
                <cbc:IdentificationCode>AUS</cbc:IdentificationCode>
              </cac:Country>
            </cac:PostalAddress>
            <cac:Contact>
              <cbc:Telephone>+61234567890</cbc:Telephone>
              <cbc:ElectronicMail>buyer@example.com</cbc:ElectronicMail>
            </cac:Contact>
          </cac:Party>
        </cac:AccountingCustomerParty>
        
        <cac:PaymentMeans>
          <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
          <cbc:PaymentID>INV-TEST-002</cbc:PaymentID>
        </cac:PaymentMeans>
        
        <cac:TaxTotal>
          <cbc:TaxAmount currencyID="AUD">15.00</cbc:TaxAmount>
          <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="AUD">150.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="AUD">15.00</cbc:TaxAmount>
            <cac:TaxCategory>
              <cbc:ID>S</cbc:ID>
              <cbc:Percent>10</cbc:Percent>
              <cac:TaxScheme>
                <cbc:ID>GST</cbc:ID>
              </cac:TaxScheme>
            </cac:TaxCategory>
          </cac:TaxSubtotal>
        </cac:TaxTotal>
        
        <cac:LegalMonetaryTotal>
          <cbc:LineExtensionAmount currencyID="AUD">250.00</cbc:LineExtensionAmount>
          <cbc:TaxExclusiveAmount currencyID="AUD">250.00</cbc:TaxExclusiveAmount>
          <cbc:TaxInclusiveAmount currencyID="AUD">275.00</cbc:TaxInclusiveAmount>
          <cbc:PayableAmount currencyID="AUD">250.00</cbc:PayableAmount>
        </cac:LegalMonetaryTotal>
        
        <cac:InvoiceLine>
          <cbc:ID>1</cbc:ID>
          <cbc:InvoicedQuantity unitCode="EA">2</cbc:InvoicedQuantity>
          <cbc:LineExtensionAmount currencyID="AUD">100.00</cbc:LineExtensionAmount>
          <cac:Item>
            <cbc:Name>Test Item A</cbc:Name>
            <cac:ClassifiedTaxCategory>
              <cbc:ID>S</cbc:ID>
              <cbc:Percent>10</cbc:Percent>
              <cac:TaxScheme>
                <cbc:ID>GST</cbc:ID>
              </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
          </cac:Item>
          <cac:Price>
            <cbc:PriceAmount currencyID="AUD">50.00</cbc:PriceAmount>
            <cbc:BaseQuantity unitCode="EA">1</cbc:BaseQuantity>
          </cac:Price>
        </cac:InvoiceLine>
        
        <cac:InvoiceLine>
          <cbc:ID>2</cbc:ID>
          <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>
          <cbc:LineExtensionAmount currencyID="AUD">50.00</cbc:LineExtensionAmount>
          <cac:Item>
            <cbc:Name>Test Item B</cbc:Name>
            <cac:ClassifiedTaxCategory>
              <cbc:ID>S</cbc:ID>
              <cbc:Percent>10</cbc:Percent>
              <cac:TaxScheme>
                <cbc:ID>GST</cbc:ID>
              </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
          </cac:Item>
          <cac:Price>
            <cbc:PriceAmount currencyID="AUD">50.00</cbc:PriceAmount>
            <cbc:BaseQuantity unitCode="EA">1</cbc:BaseQuantity>
          </cac:Price>
        </cac:InvoiceLine>
      </Invoice>
    `;

describe('POST /v1/invoices/validate', () => {
  it('should validate a valid invoice XML', async () => {
    // Create a valid XML for testing that meets Peppol standards
    const req = httpMocks.createRequest({ body: { xml: validXml } });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandard(req, res, next);

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 if no XML is provided', async () => {
    const req = httpMocks.createRequest({
      params: {} 
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandard(req, res, next);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBeTruthy();
  });

  it.each([
    ["ID", validXml.replace("<cbc:ID>TEST-002</cbc:ID>", "")],
    ["IssueDate", validXml.replace("<cbc:IssueDate>2025-03-05</cbc:IssueDate>", "")],
    ["InvoiceTypeCode", validXml.replace("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>", "")],
    ["AccountingSupplierParty", validXml.replace("<cac:AccountingSupplierParty>", "")],
    ["AccountingCustomerParty", validXml.replace("<cac:AccountingCustomerParty>", "")],
    ["LegalMonetaryTotal", validXml.replace("<cac:LegalMonetaryTotal>", "")],
    ["InvoiceLine", validXml.replace("<cac:InvoiceLine>", "")],
    ["CustomizationID", validXml.replace("<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>", "")],
    ["ProfileID", validXml.replace("<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>", "")],
    ["OrderReference", validXml.replace("<cac:OrderReference>", "")],
    ["InvoiceDocumentReference", validXml.replace("<cac:InvoiceDocumentReference>", "")]
  ])('should return 400 if XML is missing required element: %s', async (missing, invalidXml) => {
    const req = httpMocks.createRequest({ body: { xml: invalidXml } });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandard(req, res, next);

    console.log('res.body: ', res.body);
    console.log('res._getData: ', res._getData());

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBeTruthy();
  });

  // check supplier and customer
});