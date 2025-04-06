const httpMocks = require('node-mocks-http');
const {
  validateInvoiceInput,
  validateInvoiceStandard,
  validateInvoiceStandardv2,
  validatePeppol,
  validateFairWorkCommission
} = require('./invoice-validation');
const mockInvoice = require('./mockInvoice');
const xmljs = require('xml-js');

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
  ])(
    'should fail validation when %s is missing',
    (invalidInvoice, fieldName) => {
      const req = httpMocks.createRequest({ body: invalidInvoice });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      validateInvoiceInput(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res._getData()).toContain('error');
      expect(res._getData()).toContain(fieldName);
    }
  );

  // Test optional fields - these should not cause validation failures
  it.each([
    [{ ...mockInvoice, currency: undefined }, 'currency'],
    [{ ...mockInvoice, buyerAddress: undefined }, 'buyerAddress'],
    [{ ...mockInvoice, supplierAddress: undefined }, 'supplierAddress'],
    [{ ...mockInvoice, buyerPhone: undefined }, 'buyerPhone']
  ])(
    'should pass validation when optional field %s is missing',
    (validInvoice) => {
      const req = httpMocks.createRequest({ body: validInvoice });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      validateInvoiceInput(req, res, next);

      expect(next).toHaveBeenCalled();
    }
  );

  it.each([
    [{ ...mockInvoice, invoiceId: 123 }],
    [{ ...mockInvoice, total: 'string' }],
    [{ ...mockInvoice, buyer: 123 }],
    [{ ...mockInvoice, supplier: 123 }],
    [{ ...mockInvoice, issueDate: 123 }]
  ])(
    'should fail validation if fields are of incorrect type',
    (invalidInvoice) => {
      const req = httpMocks.createRequest({ body: invalidInvoice });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      validateInvoiceInput(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res._getData()).toContain('error');
    }
  );

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
                <cbc:IdentificationCode>AU</cbc:IdentificationCode>
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
                <cbc:IdentificationCode>AU</cbc:IdentificationCode>
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
    const res = httpMocks.createResponse()

    await validateInvoiceStandard(req, res, false);

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 if no XML is provided', async () => {
    const req = httpMocks.createRequest({
      params: {}
    });
    const res = httpMocks.createResponse()

    await validateInvoiceStandard(req, res, false);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBeTruthy();
  });

  it.each([
    ['ID', validXml.replace('<cbc:ID>TEST-002</cbc:ID>', '')],
    [
      'IssueDate',
      validXml.replace('<cbc:IssueDate>2025-03-05</cbc:IssueDate>', '')
    ],
    [
      'InvoiceTypeCode',
      validXml.replace('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>', '')
    ],
    [
      'AccountingSupplierParty',
      validXml.replace('<cac:AccountingSupplierParty>', '')
    ],
    [
      'AccountingCustomerParty',
      validXml.replace('<cac:AccountingCustomerParty>', '')
    ],
    ['LegalMonetaryTotal', validXml.replace('<cac:LegalMonetaryTotal>', '')],
    ['InvoiceLine', validXml.replace('<cac:InvoiceLine>', '')],
    [
      'CustomizationID',
      validXml.replace(
        '<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>',
        ''
      )
    ],
    [
      'ProfileID',
      validXml.replace(
        '<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>',
        ''
      )
    ],
    ['OrderReference', validXml.replace('<cac:OrderReference>', '')],
    [
      'InvoiceDocumentReference',
      validXml.replace('<cac:InvoiceDocumentReference>', '')
    ]
  ])(
    'should return 400 if XML is missing required element: %s',
    async (missing, invalidXml) => {
      const req = httpMocks.createRequest({ body: { xml: invalidXml } });
      const res = httpMocks.createResponse();

      await validateInvoiceStandard(req, res, false);

      expect(res.statusCode).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBeTruthy();
    }
  );

  // check supplier and customer // name, address, country code
  it.each([
    ['cac:PartyName', validXml.replace('<cac:PartyName>', '')],
    ['cac:PostalAddress', validXml.replace('<cac:PostalAddress>', '')],
    ['cbc:StreetName', validXml.replace('<cbc:StreetName>', '')],
    ['cac:Country', validXml.replace('<cac:Country>', '')],
    [
      'cbc:IdentificationCode',
      validXml.replace('<cbc:IdentificationCode>', '')
    ],
    [
      'invalid cbc:IdentificationCode',
      validXml.replace(
        '<cbc:IdentificationCode>AU',
        '<cbc:IdentificationCode>INVALID'
      )
    ]
  ])(
    'Should return 400 when missing supplier/customer detail: %s',
    async (missing, invalidXml) => {
      const req = httpMocks.createRequest({ body: { xml: invalidXml } });
      const res = httpMocks.createResponse();

      await validateInvoiceStandard(req, res, false);

      expect(res.statusCode).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBeTruthy();
    }
  );

  // check currency code
  // check total
  it.each([
    [
      'PayableAmount',
      validXml.replace(/<cbc:PayableAmount[^>]*>.*?<\/cbc:PayableAmount>/g, '')
    ],
    [
      'invalid currency',
      validXml.replace(/currencyID="AUD"/g, 'currencyID="INVALID"')
    ],
    ['missing currency', validXml.replace(/currencyID="AUD"/g, '')]
  ])(
    'should return 400 when %s in LegalMonetaryTotal is invalid',
    async (missing, invalidXml) => {
      const req = httpMocks.createRequest({ body: { xml: invalidXml } });
      const res = httpMocks.createResponse();

      await validateInvoiceStandard(req, res, false);

      expect(res.statusCode).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBeTruthy();
    }
  );

  // check invoice lines
  it.each([
    [
      'empty InvoiceLine',
      validXml.replace(
        /<cac:InvoiceLine>.*?<\/cac:InvoiceLine>/gs,
        '<cac:InvoiceLine></cac:InvoiceLine>'
      )
    ],
    ['missing line ID', validXml.replace(/<cbc:ID>1<\/cbc:ID>/, '')],
    [
      'missing item name',
      validXml.replace(/<cbc:Name>Test Item A<\/cbc:Name>/, '')
    ],
    ['missing price', validXml.replace(/<cac:Price>.*?<\/cac:Price>/gs, '')],
    [
      'missing quantity',
      validXml.replace(/<cbc:BaseQuantity.*?>.*?<\/cbc:BaseQuantity>/gs, '')
    ]
  ])(
    'should return 400 when invoice line is %s',
    async (missing, invalidXml) => {
      const req = httpMocks.createRequest({ body: { xml: invalidXml } });
      const res = httpMocks.createResponse();

      await validateInvoiceStandard(req, res, false);

      expect(res.statusCode).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBeTruthy();
    }
  );
});

describe('validateInvoiceStandardv2', () => {
  // it('should validate a valid invoice XML with peppol schema', async () => {
  //   const req = httpMocks.createRequest({ 
  //     body: { 
  //       xml: validXml,
  //       schemas: ['peppol']
  //     } 
  //   });
  //   const res = httpMocks.createResponse();
  //   const next = jest.fn();

  //   await validateInvoiceStandardv2(req, res, next);

  //   expect(next).toHaveBeenCalled();
  //   expect(req.validationResult).toBeDefined();
  //   expect(req.validationResult.valid).toBe(true);
  // });

  // it('should validate a valid invoice XML with fairwork schema', async () => {
  //   const validXmlWithFairWork = validXml.replace(
  //     '<cac:PaymentMeans>',
  //     `<cac:PaymentMeans>
  //       <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
  //       <cbc:PaymentID>INV-TEST-002</cbc:PaymentID>
  //       <cac:PayeeFinancialAccount>
  //         <cbc:ID>123456789</cbc:ID>
  //         <cbc:Name>Test Account</cbc:Name>
  //         <cac:FinancialInstitutionBranch>
  //           <cbc:BIC>TESTBIC</cbc:BIC>
  //           <cbc:Name>Test Bank</cbc:Name>
  //         </cac:FinancialInstitutionBranch>
  //       </cac:PayeeFinancialAccount>
  //     </cac:PaymentMeans>`
  //   );
    
  //   const req = httpMocks.createRequest({ 
  //     body: { 
  //       xml: validXmlWithFairWork,
  //       schemas: ['fairwork']
  //     } 
  //   });
  //   const res = httpMocks.createResponse();
  //   const next = jest.fn();

  //   await validateInvoiceStandardv2(req, res, next);

  //   expect(next).toHaveBeenCalled();
  //   expect(req.validationResult).toBeDefined();
  //   expect(req.validationResult.valid).toBe(true);
  // });

  // it('should validate a valid invoice XML with both schemas', async () => {
  //   const validXmlWithFairWork = validXml.replace(
  //     '<cac:PaymentMeans>',
  //     `<cac:PaymentMeans>
  //       <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
  //       <cbc:PaymentID>INV-TEST-002</cbc:PaymentID>
  //       <cac:PayeeFinancialAccount>
  //         <cbc:ID>123456789</cbc:ID>
  //         <cbc:Name>Test Account</cbc:Name>
  //         <cac:FinancialInstitutionBranch>
  //           <cbc:BIC>TESTBIC</cbc:BIC>
  //           <cbc:Name>Test Bank</cbc:Name>
  //         </cac:FinancialInstitutionBranch>
  //       </cac:PayeeFinancialAccount>
  //     </cac:PaymentMeans>`
  //   );
    
  //   const req = httpMocks.createRequest({ 
  //     body: { 
  //       xml: validXmlWithFairWork,
  //       schemas: ['peppol', 'fairwork']
  //     } 
  //   });
  //   const res = httpMocks.createResponse();
  //   const next = jest.fn();

  //   await validateInvoiceStandardv2(req, res, next);

  //   expect(next).toHaveBeenCalled();
  //   expect(req.validationResult).toBeDefined();
  //   expect(req.validationResult.valid).toBe(true);
  // });

  it('should return 400 if no schemas are provided', async () => {
    const req = httpMocks.createRequest({ 
      body: { 
        xml: validXml
      } 
    });
    const res = httpMocks.createResponse();

    await validateInvoiceStandardv2(req, res, false);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.status).toBe('error');
    expect(responseData.message).toBe('No schemas provided for validation');
  });

  it('should return 400 if invalid schema is provided', async () => {
    const req = httpMocks.createRequest({ 
      body: { 
        xml: validXml,
        schemas: ['invalid_schema']
      } 
    });
    const res = httpMocks.createResponse();

    await validateInvoiceStandardv2(req, res, false);

    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.status).toBe('error');
    expect(responseData.message).toBe('Invalid schema(s) provided');
  });

  it('should fail Fair Work Commission validation when PayeeFinancialAccount details are missing', async () => {
    const invalidXmlMissingPayeeDetails = validXml.replace(
      '<cac:PaymentMeans>',
      `<cac:PaymentMeans>
        <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
        <cbc:PaymentID>INV-TEST-002</cbc:PaymentID>
      </cac:PaymentMeans>`
    );
    
    const req = httpMocks.createRequest({ 
      body: { 
        xml: invalidXmlMissingPayeeDetails,
        schemas: ['fairwork']
      } 
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandardv2(req, res, next);

    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('status');
    expect(responseData.status).toBe('error');
    expect(responseData).toHaveProperty('error');
  });

  it('should fail Fair Work Commission validation when FinancialInstitutionBranch details are missing', async () => {
    const invalidXmlMissingFIBDetails = validXml.replace(
      '<cac:PaymentMeans>',
      `<cac:PaymentMeans>
        <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
        <cbc:PaymentID>INV-TEST-002</cbc:PaymentID>
        <cac:PayeeFinancialAccount>
          <cbc:ID>123456789</cbc:ID>
          <cbc:Name>Test Account</cbc:Name>
        </cac:PayeeFinancialAccount>
      </cac:PaymentMeans>`
    );
    
    const req = httpMocks.createRequest({ 
      body: { 
        xml: invalidXmlMissingFIBDetails,
        schemas: ['fairwork']
      } 
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandardv2(req, res, next);

    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('status');
    expect(responseData.status).toBe('error');
    expect(responseData).toHaveProperty('error');
  });

  it('should attach validation result to request when next is provided', async () => {
    const req = httpMocks.createRequest({ 
      body: { 
        xml: validXml,
        schemas: ['peppol']
      } 
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await validateInvoiceStandardv2(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validationResult).toBeDefined();
  });
});

describe('validatePeppol', () => {
  it('should validate a valid invoice against Peppol standards', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    if (!invoice['cbc:TaxTotal']) {
      invoice['cbc:TaxTotal'] = {
        'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
      };
    }
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors.length).toBe(0);
  });
  
  it('should fail validation when UBL namespace is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice._attributes.xmlns;
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing or invalid UBL namespace (Peppol rule BR-01) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when required elements are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cbc:ID'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing required element: cbc:ID (Peppol rule BR-12) (PEPPOL A-NZ)');
  });
  
  it('should add warning when invoice type code is not 380', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cbc:InvoiceTypeCode']._text = '381';
    
    if (!invoice['cbc:TaxTotal']) {
      invoice['cbc:TaxTotal'] = {
        'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
      };
    }
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(true);
    expect(validationResult.warnings).toContain("Invoice type code '381' is not the standard commercial invoice code '380' (Peppol rule BR-DE-08) (PEPPOL A-NZ)");
  });
  
  it('should fail validation when supplier name is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PartyName']['cbc:Name'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing supplier name (Peppol rule BR-S-02) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when customer name is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing customer name (Peppol rule BR-B-02) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when supplier contact details are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingSupplierParty']['cac:Party']['cac:Contact'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing supplier contact details (Peppol rule BR-S-09) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when customer contact details are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingCustomerParty']['cac:Party']['cac:Contact'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing customer contact details (Peppol rule BR-S-09) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when supplier street address is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PostalAddress']['cbc:StreetName'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing supplier street address (Peppol rule BR-S-05) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when supplier country code is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PostalAddress']['cac:Country']['cbc:IdentificationCode'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing supplier country code (Peppol rule BR-S-07) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when customer street address is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PostalAddress']['cbc:StreetName'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing customer street address (Peppol rule BR-B-05) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when customer country code is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PostalAddress']['cac:Country']['cbc:IdentificationCode'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing customer country code (Peppol rule BR-B-07) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when currency code is invalid', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:LegalMonetaryTotal']['cbc:PayableAmount']._attributes.currencyID = 'INVALID';
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Invalid currency code: INVALID (Peppol rule BR-40) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when document currency code is invalid', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cbc:DocumentCurrencyCode']._text = 'INVALID';
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Invalid document currency code: INVALID (Peppol rule BR-40) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when supplier country code is invalid', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PostalAddress']['cac:Country']['cbc:IdentificationCode']._text = 'INVALID';
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Invalid supplier country code: INVALID (Peppol rule BR-50) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when customer country code is invalid', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PostalAddress']['cac:Country']['cbc:IdentificationCode']._text = 'INVALID';
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Invalid customer country code: INVALID (Peppol rule BR-60) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when invoice lines are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing invoice lines (Peppol rule BR-16) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when invoice lines array is empty', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:InvoiceLine'] = [];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Invoice must contain at least one line (Peppol rule BR-16) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when line ID is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'][0]['cbc:ID'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Line 1: Missing line ID (Peppol rule BR-21) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when item name is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'][0]['cac:Item']['cbc:Name'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Line 1: Missing item name (Peppol rule BR-25) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when price information is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'][0]['cac:Price'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Line 1: Missing price information (Peppol rule BR-26) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when price amount is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'][0]['cac:Price']['cbc:PriceAmount'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Line 1: Missing price amount (Peppol rule BR-27) (PEPPOL A-NZ)');
  });
  
  it('should add warning when line currency does not match document currency', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:InvoiceLine'][0]['cac:Price']['cbc:PriceAmount']._attributes.currencyID = 'USD';
    
    if (!invoice['cbc:TaxTotal']) {
      invoice['cbc:TaxTotal'] = {
        'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
      };
    }
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(true);
    expect(validationResult.warnings).toContain('Line 1: Currency (USD) does not match document currency (AUD) (Peppol rule BR-30) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when quantity is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:InvoiceLine'][0]['cac:Price']['cbc:BaseQuantity'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Line 1: Missing quantity (Peppol rule BR-31) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when payable amount is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:LegalMonetaryTotal']['cbc:PayableAmount'];
    
    if (!invoice['cbc:TaxTotal']) {
      invoice['cbc:TaxTotal'] = {
        'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
      };
    }
    
    jest.spyOn(require('currency-codes'), 'code').mockImplementation(() => true);
    
    const validationResult = validatePeppol(invoice);
    
    jest.restoreAllMocks();
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing payable amount (Peppol rule BR-52) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when CustomizationID is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cbc:CustomizationID'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing CustomizationID (Peppol rule BR-XX) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when ProfileID is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cbc:ProfileID'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing ProfileID (Peppol rule BR-XX) (PEPPOL A-NZ)');
  });
  
  it('should fail validation when OrderReference ID is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cac:OrderReference']['cbc:ID'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing OrderReference ID (Peppol rule BR-XX) (PEPPOL A-NZ)');
  });
  
  // it('should fail validation when InvoiceDocumentReference ID is missing', () => {
  //   const options = {
  //     compact: true,
  //     ignoreComment: true,
  //     alwaysChildren: true
  //   };
  //   const parsedXml = xmljs.xml2js(validXml, options);
  //   const invoice = parsedXml.Invoice;
    
  //   delete invoice['cac:InvoiceDocumentReference']['cbc:ID'];
    
  //   if (!invoice['cbc:TaxTotal']) {
  //     invoice['cbc:TaxTotal'] = {
  //       'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
  //     };
  //   }
    
  //   jest.spyOn(require('currency-codes'), 'code').mockImplementation(() => true);
    
  //   const validationResult = validatePeppol(invoice);
    
  //   jest.restoreAllMocks();
    
  //   expect(validationResult).toHaveProperty('valid');
  //   expect(validationResult).toHaveProperty('errors');
  //   expect(validationResult.valid).toBe(false);
  //   expect(validationResult.errors).toContain('Missing InvoiceDocumentReference ID (Peppol rule BR-XX) (PEPPOL A-NZ)');
  // });
  
  it('should fail validation when TaxTotal is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    delete invoice['cbc:TaxTotal'];
    
    const validationResult = validatePeppol(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing TaxTotal (Peppol rule BR-XX) (PEPPOL A-NZ)');
  });
});

describe('validateFairWorkCommission', () => {
  // it('should validate a valid invoice against Fair Work Commission standards', () => {
  //   const options = {
  //     compact: true,
  //     ignoreComment: true,
  //     alwaysChildren: true
  //   };
  //   const parsedXml = xmljs.xml2js(validXml, options);
  //   const invoice = parsedXml.Invoice;
    
  //   invoice['cac:PaymentMeans'] = {
  //     'cbc:PaymentMeansCode': { _text: '30' },
  //     'cbc:PaymentID': { _text: 'INV-TEST-002' },
  //     'cac:PayeeFinancialAccount': {
  //       'cbc:ID': { _text: '123456789' },
  //       'cbc:Name': { _text: 'Test Account' },
  //       'cac:FinancialInstitutionBranch': {
  //         'cbc:BIC': { _text: 'TESTBIC' },
  //         'cbc:Name': { _text: 'Test Bank' }
  //       }
  //     }
  //   };
    
  //   if (!invoice['cbc:TaxTotal']) {
  //     invoice['cbc:TaxTotal'] = {
  //       'cbc:TaxAmount': { _text: '15.00', _attributes: { currencyID: 'AUD' } }
  //     };
  //   }
    
  //   jest.spyOn(require('currency-codes'), 'code').mockImplementation(() => true);
    
  //   const validationResult = validateFairWorkCommission(invoice);
    
  //   jest.restoreAllMocks();
    
  //   expect(validationResult).toHaveProperty('valid');
  //   expect(validationResult).toHaveProperty('errors');
  //   expect(validationResult.valid).toBe(true);
  //   expect(validationResult.errors.length).toBe(0);
  // });
  
  it('should fail validation when PayeeFinancialAccount details are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing PayeeFinancialAccount details (Fair Work Commission)');
  });
  
  it('should fail validation when PayeeFinancialAccount ID is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' },
      'cac:PayeeFinancialAccount': {
        'cbc:Name': { _text: 'Test Account' },
        'cac:FinancialInstitutionBranch': {
          'cbc:BIC': { _text: 'TESTBIC' },
          'cbc:Name': { _text: 'Test Bank' }
        }
      }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing PayeeFinancialAccount details (Fair Work Commission)');
  });
  
  it('should fail validation when PayeeFinancialAccount Name is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' },
      'cac:PayeeFinancialAccount': {
        'cbc:ID': { _text: '123456789' },
        'cac:FinancialInstitutionBranch': {
          'cbc:BIC': { _text: 'TESTBIC' },
          'cbc:Name': { _text: 'Test Bank' }
        }
      }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing PayeeFinancialAccount details (Fair Work Commission)');
  });
  
  it('should fail validation when FinancialInstitutionBranch details are missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' },
      'cac:PayeeFinancialAccount': {
        'cbc:ID': { _text: '123456789' },
        'cbc:Name': { _text: 'Test Account' }
      }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing FinancialInstitutionBranch details (Fair Work Commission)');
  });
  
  it('should fail validation when FinancialInstitutionBranch BIC is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' },
      'cac:PayeeFinancialAccount': {
        'cbc:ID': { _text: '123456789' },
        'cbc:Name': { _text: 'Test Account' },
        'cac:FinancialInstitutionBranch': {
          'cbc:Name': { _text: 'Test Bank' }
        }
      }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing FinancialInstitutionBranch details (Fair Work Commission)');
  });
  
  it('should fail validation when FinancialInstitutionBranch Name is missing', () => {
    const options = {
      compact: true,
      ignoreComment: true,
      alwaysChildren: true
    };
    const parsedXml = xmljs.xml2js(validXml, options);
    const invoice = parsedXml.Invoice;
    
    invoice['cac:PaymentMeans'] = {
      'cbc:PaymentMeansCode': { _text: '30' },
      'cbc:PaymentID': { _text: 'INV-TEST-002' },
      'cac:PayeeFinancialAccount': {
        'cbc:ID': { _text: '123456789' },
        'cbc:Name': { _text: 'Test Account' },
        'cac:FinancialInstitutionBranch': {
          'cbc:BIC': { _text: 'TESTBIC' }
        }
      }
    };
    
    const validationResult = validateFairWorkCommission(invoice);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors).toContain('Missing FinancialInstitutionBranch details (Fair Work Commission)');
  });
});
