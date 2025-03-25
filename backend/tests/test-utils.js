/**
 * Test utilities for the backend tests
 */

/**
 * Creates a mock request object
 * @param {Object} options - Options for the request
 * @param {Object} options.body - Request body
 * @param {Object} options.params - Request params
 * @param {Object} options.query - Request query
 * @param {Object} options.headers - Request headers
 * @param {Object} options.user - Authenticated user (for protected routes)
 * @param {Object} options.cookies - Request cookies
 * @returns {Object} Mock request object
 */
const mockRequest = (options = {}) => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    user = null,
    cookies = {}
  } = options;
  return {
    body,
    params,
    query,
    headers,
    user,
    cookies
  };
};

/**
 * Creates a mock response object
 * @returns {Object} Mock response object with jest functions
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Creates a valid test user object
 * @param {Object} overrides - Properties to override in the default user
 * @returns {Object} Test user object
 */
const createTestUser = (overrides = {}) => {
  return {
    email: 'test@example.com',
    password: 'Test1234!',
    name: 'Test User',
    ...overrides
  };
};

/**
 * Creates a mock JWT token
 * @param {Object} payload - Token payload
 * @returns {string} Mock JWT token
 */
const createMockToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };

  return `mock-token-${JSON.stringify({ ...defaultPayload, ...payload })}`;
};

const validInvoiceXML = `
  <?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
  <cac:OrderReference>
    <cbc:ID>N/A</cbc:ID>
  </cac:OrderReference>
  <cac:InvoiceDocumentReference>
    <cbc:ID>N/A</cbc:ID>
  </cac:InvoiceDocumentReference>
  <cbc:ID>TEST-002</cbc:ID>
  <cbc:IssueDate>2025-03-05</cbc:IssueDate>
  <cbc:DueDate>2025-03-10</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Test Supplier</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>123 Test St</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>AUS</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>+61234567890</cbc:Telephone>
        <cbc:ElectronicMail>supplier@test.com</cbc:ElectronicMail>
        <cbc:Name>Test Supplier</cbc:Name>
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
        <cac:Country>
          <cbc:IdentificationCode>AUS</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>+61234567890</cbc:Telephone>
        <cbc:ElectronicMail>buyer@test.com</cbc:ElectronicMail>
        <cbc:Name>Test Buyer</cbc:Name>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cac:PayeeFinancialAccount>
      <cbc:ID>128394</cbc:ID>
      <cbc:Name>Company Pty Ltd</cbc:Name>
      <cac:FinancialInstitutionBranch>
        <cbc:ID>383-292</cbc:ID>
      </cac:FinancialInstitutionBranch>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="AUD">250</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cac:Item>
      <cbc:Name>Test Item A</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="AUD">100</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="EA">2</cbc:BaseQuantity>
    </cac:Price>
  </cac:InvoiceLine>
  <cac:InvoiceLine>
    <cbc:ID>2</cbc:ID>
    <cac:Item>
      <cbc:Name>Test Item B</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="AUD">50</cbc:PriceAmount>
      <cbc:BaseQuantity unitCode="EA">1</cbc:BaseQuantity>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>
`;

module.exports = {
  mockRequest,
  mockResponse,
  createTestUser,
  createMockToken,
  validInvoiceXML
};
