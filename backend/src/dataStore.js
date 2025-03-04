Interface Data = {
    users: {[
        name: String,
        email: String,
        password: String,
        userId: Number,
        oldPasswords: String[]
    ]},
    activeUsers: {[
        userId: Number,
        token: String,
        loginTime: Number
    ]},
    invoices: {
        invoiceId: String,
        // line items (e.g issue date, due date, amount, etc)
        total: Number,
        buyer: String,
        supplier: String,
        ?buyerAddress: {
            // street name, country, etc
        },
        ?buyerPhone: Number,
        ?buyerEmail: String,
        ?supplierAddress: {
            // street name, country, etc
        },
        ?supplierPhone: Number,
        ?supplierEmail: String,
        issueDate: Number,
        dueDate: Number,
        //
        items: [{
            name: String
            count: Number
            price: Number
        }],
        userId: String, // who owns the invoice
        shared: String[],
        isValid: Boolean
    }
}

export data; 