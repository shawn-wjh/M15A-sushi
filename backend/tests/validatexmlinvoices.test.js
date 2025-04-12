const validateXmlInvoices = require('../src/middleware/validateXmlInvoices');

describe('validateXmlInvoices middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      xmlData: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 400 if no invoice data is provided', async () => {
    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'No invoice data provided.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate a single valid invoice from req.xmlData', async () => {
    req.xmlData = {
      Invoice: {
        IssueDate: '2024-03-20',
        DueDate: '2024-04-20',
        LegalMonetaryTotal: {
          PayableAmount: '100.00'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedInvoices).toEqual([req.xmlData.Invoice]);
  });

  it('should validate a single valid invoice from req.body.xmlDataset', async () => {
    req.body.xmlDataset = {
      Invoice: {
        IssueDate: '2024-03-20',
        DueDate: '2024-04-20',
        LegalMonetaryTotal: {
          PayableAmount: '100.00'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedInvoices).toEqual([req.body.xmlDataset.Invoice]);
  });

  it('should validate multiple valid invoices', async () => {
    req.xmlData = {
      Invoices: {
        Invoice: [
          {
            IssueDate: '2024-03-20',
            DueDate: '2024-04-20',
            LegalMonetaryTotal: {
              PayableAmount: '100.00'
            }
          },
          {
            IssueDate: '2024-03-21',
            DueDate: '2024-04-21',
            LegalMonetaryTotal: {
              PayableAmount: '200.00'
            }
          }
        ]
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedInvoices).toEqual(req.xmlData.Invoices.Invoice);
  });

  it('should return 400 if an invoice is missing IssueDate', async () => {
    req.xmlData = {
      Invoice: {
        DueDate: '2024-04-20',
        LegalMonetaryTotal: {
          PayableAmount: '100.00'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid invoice data.',
      errors: ['Invoice at index 0 is missing IssueDate.']
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if an invoice is missing DueDate', async () => {
    req.xmlData = {
      Invoice: {
        IssueDate: '2024-03-20',
        LegalMonetaryTotal: {
          PayableAmount: '100.00'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid invoice data.',
      errors: ['Invoice at index 0 is missing DueDate.']
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if an invoice is missing LegalMonetaryTotal', async () => {
    req.xmlData = {
      Invoice: {
        IssueDate: '2024-03-20',
        DueDate: '2024-04-20'
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid invoice data.',
      errors: ['Invoice at index 0 is missing total amount information.']
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if an invoice has invalid date format', async () => {
    req.xmlData = {
      Invoice: {
        IssueDate: 'invalid-date',
        DueDate: '2024-04-20',
        LegalMonetaryTotal: {
          PayableAmount: '100.00'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid invoice data.',
      errors: ['Invoice at index 0 has an invalid IssueDate.']
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if an invoice has invalid monetary amount', async () => {
    req.xmlData = {
      Invoice: {
        IssueDate: '2024-03-20',
        DueDate: '2024-04-20',
        LegalMonetaryTotal: {
          PayableAmount: 'invalid-amount'
        }
      }
    };

    await validateXmlInvoices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid invoice data.',
      errors: ['Invoice at index 0 has an invalid monetary amount.']
    });
    expect(next).not.toHaveBeenCalled();
  });
});
