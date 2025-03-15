const { convertToUBL } = require('./invoice-generation');
const mockInvoice = require('./mockInvoice');

describe('Invoice Generation Tests', () => {
  describe('convertToUBL', () => {
    it('should convert invoice data to valid UBL XML with all required fields', () => {
      const result = convertToUBL(mockInvoice);
      
      // Test XML declaration and root structure
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Invoice');
      expect(result).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
      
      // Test required UBL fields
      expect(result).toContain('<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>');
      expect(result).toContain('<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>');
      expect(result).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
      
      // Test invoice data fields
      expect(result).toContain(`<cbc:ID>${mockInvoice.invoiceId}</cbc:ID>`);
      expect(result).toContain(`<cbc:IssueDate>${mockInvoice.issueDate}</cbc:IssueDate>`);
      expect(result).toContain(`<cbc:DueDate>${mockInvoice.dueDate}</cbc:DueDate>`);
      expect(result).toContain(`<cbc:DocumentCurrencyCode>${mockInvoice.currency}</cbc:DocumentCurrencyCode>`);
      
      // Test party information
      expect(result).toContain(mockInvoice.buyer);
      expect(result).toContain(mockInvoice.supplier);
      expect(result).toContain(mockInvoice.buyerAddress.street);
      expect(result).toContain(mockInvoice.buyerAddress.country);
      expect(result).toContain(mockInvoice.buyerPhone);
      
      // Test payment information
      expect(result).toContain(mockInvoice.paymentAccountId);
      expect(result).toContain(mockInvoice.paymentAccountName);
      expect(result).toContain(mockInvoice.financialInstitutionBranchId);
      
      // Test line items
      mockInvoice.items.forEach(item => {
        expect(result).toContain(item.name);
        expect(result).toContain(item.count.toString());
        expect(result).toContain(item.cost.toString());
      });
      
      // Test monetary total
      expect(result).toContain(`>${mockInvoice.total.toString()}</`);
    });

    it('should handle optional fields correctly', () => {
      const minimalInvoice = {
        invoiceId: "INV001",
        total: 100,
        buyer: "Test Buyer",
        supplier: "Test Supplier",
        issueDate: "2024-03-10",
        currency: "AUD",
        paymentAccountId: "TEST123",
        paymentAccountName: "Test Account",
        financialInstitutionBranchId: "TESTBANK",
        items: [{ name: "Test Item", count: 1, cost: 100 }]
      };

      const result = convertToUBL(minimalInvoice);
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).not.toContain('<cbc:DueDate>');
      expect(result).not.toContain('<cbc:StreetName>');
    });

    it('should handle currency defaults correctly', () => {
      const invoiceWithoutCurrency = { ...mockInvoice };
      delete invoiceWithoutCurrency.currency;
      
      const result = convertToUBL(invoiceWithoutCurrency);
      expect(result).toContain('<cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>');
      expect(result).toContain('currencyID="AUD"');
    });

    it('should format line items correctly', () => {
      const result = convertToUBL(mockInvoice);
      
      mockInvoice.items.forEach((item, index) => {
        expect(result).toContain(`<cbc:ID>${index + 1}</cbc:ID>`);
        expect(result).toContain(`<cbc:Name>${item.name}</cbc:Name>`);
        expect(result).toContain(`<cbc:PriceAmount`);
        expect(result).toContain(`<cbc:BaseQuantity unitCode="EA">${item.count}</cbc:BaseQuantity>`);
        expect(result).toContain(`<cbc:ID>S</cbc:ID>`); 
      });
    });
  });
});
