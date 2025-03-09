const mockInvoice = {
    invoiceId: "TEST-002",
    total: 150,
    buyer: "Test Buyer",
    supplier: "Test Supplier",
    issueDate: "2025-03-05",
    dueDate: "2025-03-10", 
    currency: "AUD",
    buyerAddress: {
        street: "123 Test St",
        country: "AU"
    },
    buyerPhone: "+61234567890",
    items: [
        {
            name: "Test Item A",
            count: 2,
            cost: 100,
            currency: "AUD"
        },
        {
            name: "Test Item B", 
            count: 1,
            cost: 50,
            currency: "AUD"
        }
    ]
};

module.exports = mockInvoice;