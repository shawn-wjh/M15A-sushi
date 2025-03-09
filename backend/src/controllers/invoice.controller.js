const { v4: uuidv4 } = require("uuid");
const { createDynamoDBClient, Tables } = require("../config/database");
const fs = require("fs").promises;
const path = require("path");
const {
  generateAndUploadUBLInvoice,
} = require("../middleware/invoice-generation");
const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

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

      // Generate and store UBL invoice in S3
      const status = await generateAndUploadUBLInvoice(data, invoiceId);
      console.log("generateAndUploadUBLInvoice status: ", status);

      // Prepare invoice item for DynamoDB
      const invoiceItem = {
        TableName: Tables.INVOICES,
        Item: {
          InvoiceID: invoiceId,
          timestamp: timestamp,
          UserID: "123", // TODO: Get UserID from request
          s3Url: status.location,
        },
      };

      // Store in DynamoDB
      const test = await dbClient.send(new PutCommand(invoiceItem));
      console.log("dbclient.sent worked: ", test);

      return res.status(200).json({
        status: "success",
        message: "Invoice created successfully",
        invoiceId: invoiceId,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to create invoice",
        details: error.message,
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
      // TODO:
      // 1. Get invoices from DynamoDB
      // 2. Map to return only necessary fields
      // 3. Return formatted response

      return res.status(200).json({
        status: "success",
        data: {
          count: 0,
          invoices: [],
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to list invoices",
        details: error.message,
      });
    }
  },

  /**
   * Get a specific invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getInvoice: async (req, res) => {
    try {
      // TODO:
      // 1. Get invoiceId from request parameters
      // 2. Query DynamoDB for the invoice
      // 3. Check if invoice exists
      // 4. Return invoice details

      return res.status(200).json({
        status: "success",
        data: {
          // Invoice details will go here
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to get invoice",
        details: error.message,
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
      // TODO:
      // 1. Get invoiceId from request parameters
      // 2. Check if invoice exists
      // 3. Update invoice in DynamoDB with given data
      // 4. Return success message

      return res.status(200).json({
        status: "success",
        message: "Invoice updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to update invoice",
        details: error.message,
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
      // TODO:
      // 1. Get invoiceId from request parameters
      // 2. Check if invoice exists
      // 3. Delete from DynamoDB
      // 4. Delete from local file system if it exists
      // 5. Return success message

      return res.status(200).json({
        status: "success",
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to delete invoice",
        details: error.message,
      });
    }
  },
};

module.exports = invoiceController;
