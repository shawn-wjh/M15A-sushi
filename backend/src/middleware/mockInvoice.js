const mockInvoice = {
  invoiceId: "TEST-002",
  total: 250,
  buyer: "Test Buyer",
  supplier: "Test Supplier",
  issueDate: "2025-03-05",
  dueDate: "2025-03-10",
  currency: "AUD",
  buyerAddress: {
    street: "123 Test St",
    country: "AUS",
  },
  buyerEmail: "buyer@test.com",
  buyerPhone: "+61234567890",
  supplierAddress: {
    street: "123 Test St",
    country: "AUS",
  },
  supplierEmail: "supplier@test.com",
  supplierPhone: "+61234567890",
  paymentAccountId: "128394", // bank account number
  paymentAccountName: "Company Pty Ltd", // account name
  financialInstitutionBranchId: "383-292", // branch identifier such as BSB
  items: [
    {
      name: "Test Item A",
      count: 2,
      cost: 100,
      currency: "AUD",
    },
    {
      name: "Test Item B",
      count: 1,
      cost: 50,
      currency: "AUD",
    },
  ],
};

module.exports = mockInvoice;
