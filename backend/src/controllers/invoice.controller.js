const { v4: uuidv4 } = require('uuid');
const { createDynamoDBClient, Tables } = require('../config/database');
const {
  PutCommand,
  ScanCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { convertToUBL } = require('../middleware/invoice-generation');
const xml2js = require('xml2js');
const { checkUserId } = require('../middleware/helperFunctions');

// Initialize DynamoDB Client
const dbClient = createDynamoDBClient();

// Helper function to parse XML safely
const parseXML = async (xmlString) => {
  try {
    // First, check if we have valid XML
    if (!xmlString || typeof xmlString !== 'string') {
      console.error('Invalid XML string:', xmlString);
      return null;
    }

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
      attrNameProcessors: [xml2js.processors.stripPrefix]
    });
    
    const result = await parser.parseStringPromise(xmlString);

    // Extract relevant data from the parsed XML
    const invoice = result?.Invoice || {};
    return {
      IssueDate: invoice.IssueDate || null,
      DueDate: invoice.DueDate || null,
      TotalPayableAmount: invoice.LegalMonetaryTotal?.PayableAmount || 
                          invoice.LegalMonetaryTotal?.TaxInclusiveAmount ||
                          null
    };
  } catch (error) {
    console.error('Error parsing XML:', error);
    console.error('XML content:', xmlString);
    return null;
  }
};

/**
 * Invoice Controller
 * Handles all invoice-related operations
 */
const invoiceController = {
  /**
   * Create a new invoice
   * Stores the generated UBL invoice in DynamoDB
   * @param {Object} req - invoice object
   * @param {Object} res - Express response object
   */
  createInvoice: async (req, res, next) => {
    try {
      // Get the invoice data from the request body
      const data = req.body.invoice || req.body;
      const timestamp = new Date().toISOString();
      const invoiceId = uuidv4();

      // Convert invoice to UBL XML
      const ublXml = convertToUBL(data);

      if (!checkUserId(req.user.userId)) {
        return res.status(401).json({
          status: 'error',
          error: 'No user ID provided',
        });
      }

      // Prepare invoice item for DynamoDB
      const invoiceItem = {
        TableName: Tables.INVOICES,
        Item: {
          InvoiceID: invoiceId,
          timestamp,
          UserID: req.user.userId,
          invoice: ublXml,
          valid: req.validationResult?.valid || false,
          invoiceJson: data
        }
      };

      // Store in DynamoDB
      await dbClient.send(new PutCommand(invoiceItem));

      // Check if this is part of a middleware chain (like in create-and-validate)
      // or a direct route handler (like in /create)
      if (next && req.route && req.route.path === '/create-and-validate') {
        // Set invoiceId for next functions
        req.params.invoiceid = invoiceId;
        next();
      } else {
        return res.status(200).json({
          status: 'success',
          message: 'Invoice created successfully',
          invoiceId: invoiceId,
          invoice: ublXml
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create invoice',
        details: error.message
      });
    }
  },

  /**
   * List all invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  listInvoices: async (req, res) => {
    // Extract and validate query parameters first, before any async operations
    let { limit, offset, sort, order } = req.query;
    
    // Validate limit
    limit = parseInt(limit, 10) || 10;
    if (limit < 1) {
      return res.status(400).json({
        status: 'error',
        error: 'limit must be greater than 0'
      });
    }

    // Validate offset
    offset = parseInt(offset, 10) || 0;
    if (offset < 0) {
      return res.status(400).json({
        status: 'error',
        error: 'offset must be at least 0'
      });
    }

    // Validate sort and order if provided
    const validSortFields = ['issuedate', 'duedate', 'total'];
    const validOrders = ['asc', 'desc'];
    
    if (sort && !validSortFields.includes(sort.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        error: 'invalid sort query'
      });
    }
    
    if (order && !validOrders.includes(order.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        error: 'invalid order query'
      });
    }

    try {
      let { limit, offset, sort, order } = req.query;
      limit = parseInt(limit, 10) || 10;
      offset = parseInt(offset, 10) || 0;

      if (limit < 1) {
        return res.status(400).json({
          status: 'error',
          error: 'limit must be greater than 0'
        });
      }
      if (offset < 0) {
        return res.status(400).json({
          status: 'error',
          error: 'offset must be at least 0'
        });
      }

      // Validate sort and order if provided
      const validSortFields = ['issuedate', 'duedate', 'total'];
      const validOrders = ['asc', 'desc'];
      if (sort && !validSortFields.includes(sort.toLowerCase())) {
        return res.status(400).json({
          status: 'error',
          error: 'invalid sort query'
        });
      }
      if (order && !validOrders.includes(order.toLowerCase())) {
        return res.status(400).json({
          status: 'error',
          error: 'invalid order query'
        });
      }

      const userId = req.user.userId;

      const scanParams = {
        TableName: Tables.INVOICES,
        FilterExpression: 'UserID = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const { Items } = await dbClient.send(new ScanCommand(scanParams));
      const allInvoices = Items || [];

      // Parse all invoices first
      const parsedInvoices = await Promise.all(allInvoices.map(async (invoice) => {
        const parsedXML = await parseXML(invoice.invoice);
        if (!parsedXML) {
          console.error('Failed to parse invoice:', invoice.InvoiceID);
        }
        return {
          ...invoice,
          parsedData: parsedXML || {
            IssueDate: null,
            DueDate: null,
            TotalPayableAmount: null
          }
        };
      }));

      if (sort) {
        parsedInvoices.sort((a, b) => {
          const aData = a.parsedData || {};
          const bData = b.parsedData || {};

          let aValue, bValue;

          switch (sort.toLowerCase()) {
            case 'issuedate':
              aValue = aData.IssueDate ? new Date(aData.IssueDate) : null;
              bValue = bData.IssueDate ? new Date(bData.IssueDate) : null;
              break;
            case 'duedate':
              aValue = aData.DueDate ? new Date(aData.DueDate) : null;
              bValue = bData.DueDate ? new Date(bData.DueDate) : null;
              break;
            case 'total':
              aValue = aData.TotalPayableAmount._ ? parseFloat(aData.TotalPayableAmount._) : null;
              bValue = bData.TotalPayableAmount._ ? parseFloat(bData.TotalPayableAmount._) : null;
              break;
            default:
              return 0;
          }

          // Handle null values
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;

          // Compare valid values
          return aValue - bValue;
        });

        if (order && order.toLowerCase() === 'desc') {
          parsedInvoices.reverse();
        }
      }

      // remove the parsedData field from the invoices after sorting
      parsedInvoices.forEach(invoice => {
        delete invoice.parsedData;
      });

      // apply offset and limit
      const maxOffset = parsedInvoices.length;
      if (offset > maxOffset) {
        offset = maxOffset - limit; // default to limit
      }

      const paginatedInvoices = parsedInvoices.slice(offset, offset + limit);

      return res.status(200).json({
        status: 'success',
        data: {
          count: parsedInvoices.length,
          invoices: paginatedInvoices
        }
      });
    } catch (error) {
      console.error('Error in listInvoices:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to list invoices',
        details: error.message
      });
    }
  },

  /**
   * Get a specific invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getInvoice: async (req, res, next) => {
    const invoiceId = req.params.invoiceid;

    // check if invoiceId is empty
    if (!invoiceId) {
      throw new Error('Missing invoice ID');
    }

    try {
      // Query DynamoDB for the invoice using document client
      const queryParams = {
        TableName: Tables.INVOICES,
        KeyConditionExpression: 'InvoiceID = :InvoiceID',
        ExpressionAttributeValues: {
          ':InvoiceID': invoiceId
        }
      };

      const { Items } = await dbClient.send(new QueryCommand(queryParams));

      if (!Items || Items.length === 0) {
        throw new Error('Invoice not found');
      }

      // check if allowed access
      if (!checkUserId(req.user.userId, Items[0])) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }

      // access the invoice from the dynamoDB response
      const xml = Items[0].invoice;

      if (next) {
        req.body.xml = xml;
        next();
      } else {
        return res.status(200).set('Content-Type', 'application/xml').send(xml);
      }
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        error: error.message
      });
    }
  },

  // /**
  //  * Download an invoice as UBL XML
  //  * @param {Object} req - Express request object
  //  * @param {Object} res - Express response object
  //  */
  // downloadInvoice: async (req, res) => {
  //     try {
  //         // TODO:
  //         // 1. Get invoiceId from request parameters
  //         // 2. Query DynamoDB for the invoice
  //         // 3. Check if invoice exists
  //         // 4. Set response headers for XML download
  //         // 5. Send XML content

  //         return res.status(200).send('XML content will go here');
  //     } catch (error) {
  //         return res.status(500).json({
  //             status: 'error',
  //             message: 'Failed to download invoice',
  //             details: error.message
  //         });
  //     }
  // },

  /**
   * Update an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns
   */
  updateInvoice: async (req, res) => {
    try {
      const invoiceId = req.params.invoiceid;
      const updateData = req.body;

      console.log('Updating invoice:', invoiceId);
      console.log('Update data:', JSON.stringify(updateData, null, 2));

      // Check if invoiceId is provided
      if (!invoiceId) {
        return res.status(400).json({
          status: 'error',
          error: 'Missing invoice ID'
        });
      }

      // Check if invoice exists using document client
      const queryParams = {
        TableName: Tables.INVOICES,
        KeyConditionExpression: 'InvoiceID = :InvoiceID',
        ExpressionAttributeValues: {
          ':InvoiceID': invoiceId
        }
      };

      const { Items } = await dbClient.send(new QueryCommand(queryParams));

      if (!Items || Items.length === 0) {
        return res.status(400).json({
          status: 'error',
          error: 'Invalid Invoice ID'
        });
      }

      if (!checkUserId(req.user.userId, Items[0])) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }

      // Ensure all numeric values are properly formatted
      if (updateData.total) updateData.total = parseFloat(updateData.total);
      if (updateData.taxTotal) updateData.taxTotal = parseFloat(updateData.taxTotal);
      if (updateData.taxRate) updateData.taxRate = parseFloat(updateData.taxRate);
      
      // Format items
      if (updateData.items && updateData.items.length > 0) {
        updateData.items = updateData.items.map(item => ({
          ...item,
          count: parseFloat(item.count) || 0,
          cost: parseFloat(item.cost) || 0,
          currency: item.currency || updateData.currency || 'AUD'
        }));
      }

      // Convert updated data to UBL XML
      const ublXml = convertToUBL(updateData);
      console.log('Generated UBL XML:', ublXml);

      // Update using document client
      const updateParams = {
        TableName: Tables.INVOICES,
        Item: {
          InvoiceID: invoiceId,
          UserID: Items[0].UserID,
          invoice: ublXml,
          timestamp: new Date().toISOString(), // update time last modified
          valid: false, // invalidate the invoice after update by default
        }
      };

      await dbClient.send(new PutCommand(updateParams));
      console.log('Invoice updated successfully');

      return res.status(200).json({
        status: 'success',
        message: 'Invoice updated successfully',
        invoiceId: invoiceId
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      return res.status(400).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Delete an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteInvoice: async (req, res) => {
    try {
      const invoiceId = req.params.invoiceid;

      if (!invoiceId) {
        return res.status(400).json({
          status: 'error',
          error: 'Missing invoice ID'
        });
      }

      // check if invoice exists
      const queryParams = {
        TableName: Tables.INVOICES,
        KeyConditionExpression: 'InvoiceID = :InvoiceID',
        ExpressionAttributeValues: {
          ':InvoiceID': invoiceId
        }
      };

      const { Items } = await dbClient.send(new QueryCommand(queryParams));

      if (!Items || Items.length === 0) {
        return res.status(400).json({
          status: 'error',
          error: 'Invoice not found'
        });
      }

      if (!checkUserId(req.user.userId, Items[0])) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }

      // Get the UserID from the found item
      const userID = Items[0].UserID;

      // delete from DynamoDB
      const deleteParams = {
        TableName: Tables.INVOICES,
        Key: {
          InvoiceID: invoiceId,
          UserID: userID
        }
      };

      await dbClient.send(new DeleteCommand(deleteParams));

      return res.status(200).json({
        status: 'success',
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Validate an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateValidationStatus: async (req, res, next) => {
    try {
      const invoiceId = req.params.invoiceid;
      const valid = req.validationResult.valid;
      
      if (!invoiceId || valid === undefined) {
        return res.status(400).json({
          status: 'error',
          error: 'Missing invoice ID or valid status'
        });
      }
      
      if (!checkUserId(req.user.userId)) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }

      // find the invoice in the database
      const queryParams = {
        TableName: Tables.INVOICES,
        KeyConditionExpression: 'InvoiceID = :InvoiceID',
        ExpressionAttributeValues: {
          ':InvoiceID': invoiceId
        }
      };

      const { Items } = await dbClient.send(new QueryCommand(queryParams));

      if (!Items || Items.length === 0) {
        return res.status(400).json({
          status: 'error',
          error: 'Invoice not found'
        });
      }

      // check if the user has access to the invoice
      if (!checkUserId(req.user.userId, Items[0])) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }

      const updateParams = {
        TableName: Tables.INVOICES,
        Key: {
          InvoiceID: invoiceId,
          UserID: req.user.userId
        },
        UpdateExpression: 'set valid = :valid',
        ExpressionAttributeValues: {
          ':valid': valid
        }
      };

      await dbClient.send(new UpdateCommand(updateParams));
      
      if (next) {
        req.status = 'success';
        req.message = `Validation status successfully updated to ${valid}`;
        next();
      } else {
        return res.status(200).json({
          status: 'success',
          message: `Validation status successfully updated to ${valid}`
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  }
};

module.exports = invoiceController;
