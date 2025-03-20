const { v4: uuidv4 } = require('uuid');
const { createDynamoDBClient, Tables } = require('../config/database');
// const fs = require('fs').promises;
// const path = require('path');
const {
  PutCommand,
  ScanCommand,
  // UpdateCommand,
  QueryCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const {
  // generateAndUploadUBLInvoice,
  convertToUBL
} = require('../middleware/invoice-generation');
// const { items } = require('../middleware/mockInvoice');
// const { error } = require('console');

// Initialize DynamoDB client
const dbClient = createDynamoDBClient();

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
  createInvoice: async (req, res) => {
    try {
      // TODO:
      // 1. Get the generated invoice from the previous middleware
      // 2. Create timestamp
      // 3. Prepare invoice item for DynamoDB
      // 4. Store in DynamoDB

      const data = req.body;
      const timestamp = new Date().toISOString();
      const invoiceId = uuidv4();

      // convert invoice to UBL XML
      const ublXml = convertToUBL(data);

      // Prepare invoice item for DynamoDB
      const invoiceItem = {
        TableName: Tables.INVOICES,
        Item: {
          InvoiceID: invoiceId,
          timestamp,
          UserID: '123', // TODO: Get UserID from request
          // s3Url: status.location
          invoice: ublXml
        }
      };

      // Store in DynamoDB
      await dbClient.send(new PutCommand(invoiceItem));

      return res.status(200).json({
        status: 'success',
        message: 'Invoice created successfully',
        invoiceId: invoiceId,
        invoice: ublXml
      });
    } catch (error) {
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
    try {
      let { limit, offset, sort, order } = req.query;
      limit = parseInt(limit, 10);
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

      // leaving userId as 123 as thats what has been done on previous codes
      const userId = '123';

      const scanParams = {
        TableName: Tables.INVOICES,
        FilterExpression: 'UserID = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const { Items } = await dbClient.send(new ScanCommand(scanParams));
      const allInvoices = Items || [];

      if (sort) {
        switch (sort.toLowerCase()) {
          case 'issuedate':
            allInvoices.sort((a, b) => {
              return new Date(a.timestamp) - new Date(b.timestamp);
            });
            break;
          default:
            break;
        }
        if (order && order.toLowerCase() === 'desc') {
          allInvoices.reverse();
        }
      }

      const totalInvoices = allInvoices.length;
      const maxOffset = totalInvoices - limit;
      if (offset > maxOffset) {
        offset = maxOffset < 0 ? 0 : maxOffset;
      }

      const paginatedInvoices = allInvoices.slice(offset, offset + limit);

      return res.status(200).json({
        status: 'success',
        data: {
          count: totalInvoices,
          invoices: paginatedInvoices
        }
      });
    } catch (error) {
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
  getInvoice: async (req, res) => {
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

      // access the invoice from the dynamoDB response
      const xml = Items[0].invoice;

      return res.status(200).set('Content-Type', 'application/xml').send(xml);
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
          error: 'Invoice not found'
        });
      }

      // Convert updated data to UBL XML
      const ublXml = convertToUBL(updateData);

      // Update using document client
      const updateParams = {
        TableName: Tables.INVOICES,
        Item: {
          InvoiceID: invoiceId,
          UserID: Items[0].UserID,
          invoice: ublXml,
          timestamp: new Date().toISOString()
        }
      };

      // Update invoice in DynamoDB using PutCommand to ensure complete replacement
      await dbClient.send(new PutCommand(updateParams));

      return res.status(200).json({
        status: 'success',
        message: 'Invoice updated successfully',
        invoiceId: invoiceId
      });
    } catch (error) {
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
  }
};

module.exports = invoiceController;
