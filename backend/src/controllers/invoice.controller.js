const { v4: uuidv4 } = require('uuid');
const { createDynamoDBClient, Tables, createSESClient } = require('../config/database');
const {
  PutCommand,
  ScanCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { convertToUBL } = require('../middleware/invoice-generation');
const xml2js = require('xml2js');
const { checkUserId, UserCanViewInvoice } = require('../middleware/helperFunctions');
const validator = require('validator');
const nodemailer = require('nodemailer');
const config = require('../config/index');
const path = require('path');

const dbClient = createDynamoDBClient();

// Helper function to parse XML safely
const parseXML = async (xmlString) => {
  try {
    // First, check if we have valid XML
    if (!xmlString || typeof xmlString !== 'string') {
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
      if (!UserCanViewInvoice(req.user.userId, Items[0], req.user.email)) {
        return res.status(401).json({
          status: 'error',
          error: 'Unauthorised Access'
        });
      }
      
      // access the invoice from the dynamoDB response
      const xml = Items[0].invoice;

      if (next) {
        req.body.xml = xml;
        req.invoice = Items[0];
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
  },

  /**
   * Send invoice to recipient via Peppol network
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendInvoice: async (req, res) => {
    try {
      const { recipientId } = req.body;
      const userId = req.user.userId;
      
      if (!recipientId) {
        return res.status(400).json({
          status: 'error',
          message: 'Recipient ID is required'
        });
      }
      
      // Get user's Peppol settings
      const getUserParams = {
        TableName: Tables.USERS,
        Key: { 
          UserID: userId 
        }
      };
      
      const userResult = await dbClient.send(new QueryCommand(getUserParams));
      
      if (!userResult.Items || userResult.Items.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      const user = userResult.Items[0];
      const peppolSettings = user.peppolSettings;
      
      // Check if user has configured Peppol
      if (!peppolSettings || !peppolSettings.isConfigured) {
        // Fall back to system-wide Peppol settings if user hasn't configured their own
        console.log('Using system Peppol settings - user has not configured Peppol');
      }
      
      // Invoice XML should be available from the getInvoice middleware
      const invoiceXml = req.invoice.invoice;
      
      // Use user's Peppol settings if available, otherwise fall back to system settings
      const result = await invoiceSendingService.sendInvoice(
        invoiceXml, 
        recipientId,
        peppolSettings?.apiKey,
        peppolSettings?.apiUrl
      );
      
      return res.status(200).json({
        status: 'success',
        message: 'Invoice sent successfully',
        deliveryId: result.deliveryId,
        timestamp: result.timestamp
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send invoice',
        details: error.message
      });
    }
  },

  /**
   * Check delivery status of sent invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  checkDeliveryStatus: async (req, res) => {
    try {
      const { deliveryId } = req.params;
      const userId = req.user.userId;
      
      // Get user's Peppol settings
      const getUserParams = {
        TableName: Tables.USERS,
        Key: { 
          UserID: userId 
        }
      };
      
      const userResult = await dbClient.send(new QueryCommand(getUserParams));
      
      if (!userResult.Items || userResult.Items.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      const user = userResult.Items[0];
      const peppolSettings = user.peppolSettings;
      
      // Check delivery status using user's Peppol settings if available
      const result = await invoiceSendingService.checkDeliveryStatus(
        deliveryId,
        peppolSettings?.apiKey,
        peppolSettings?.apiUrl
      );
      
      return res.status(200).json({
        status: 'success',
        deliveryId: result.deliveryId,
        deliveryStatus: result.status,
        deliveredAt: result.deliveredAt
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to check delivery status',
        details: error.message
      });
    }
  },

  shareInvoice: async (req, res) => {
    try {
      const { invoiceid } = req.params;
      const { recipients } = req.body;

      // check if new recipient emails are valid
      for (const email of recipients) {
        if (!validator.isEmail(email)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid recipient email: ' + email
          });
        }
      }

      // check if invoice exists
      const queryParams = {
        TableName: Tables.INVOICES,
        KeyConditionExpression: 'InvoiceID = :InvoiceID',
        ExpressionAttributeValues: {
          ':InvoiceID': invoiceid
        }
      };

      const { Items } = await dbClient.send(new QueryCommand(queryParams));

      if (!Items || Items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid invoice ID'
        });
      }

      // check if user has access to the invoice
      if (!checkUserId(req.user.userId, Items[0])) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorised Access'
        });
      }

      // Initialize sharedWith array with existing recipients or empty array if field doesn't exist
      const existingRecipients = Items[0].sharedWith || [];
      
      const recipientEmails = [...existingRecipients, ...recipients];

      // Remove any duplicates
      const uniqueRecipients = [...new Set(recipientEmails)];

      const updateParams = {
        TableName: Tables.INVOICES,
        Key: {
          InvoiceID: invoiceid,
          UserID: req.user.userId
        },
        UpdateExpression: 'set sharedWith = :sharedWith',
        ExpressionAttributeValues: {
          ':sharedWith': uniqueRecipients
        },
        ReturnValues: 'ALL_NEW' // This will return the updated item
      };

      const result = await dbClient.send(new UpdateCommand(updateParams));

      if (!result) {
        throw new Error('Failed to share invoice');
      }

      return res.status(200).json({
        status: 'success',
        message: 'Invoice shared successfully',
        sharedWith: uniqueRecipients
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to share invoice',
        details: error.message
      });
    }
  },

  unshareInvoice: async (req, res) => {
    try {
      console.log('unshareInvoice called');
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to unshare invoice',
        details: error.message
      });
    }
  },

  /**
   * List all invoices shared with the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  listSharedInvoices: async (req, res) => {
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

     const userEmail = req.user.email;

     const scanParams = {
       TableName: Tables.INVOICES,
       FilterExpression: 'contains(sharedWith, :userEmail)',
       ExpressionAttributeValues: {
         ':userEmail': userEmail
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
     return res.status(500).json({
       status: 'error',
       message: 'Failed to list invoices',
       details: error.message
     });
   }
  },

  emailInvoice: async (req, res) => {
    try {
      const invoice = req.body.xml;
      const invoiceId = req.params.invoiceid;
      const senderName = req.user.name;
      const senderEmail = req.user.email;
      const recipientEmails = req.body.recipients;

      if (!invoice || !invoiceId) {
        return res.status(400).json({
          status: 'error',
          message: 'Invoice or invoice ID not provided'
        });
      }

      if (!senderName || !senderEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Sender name or email missing'
        });
      }

      if (!recipientEmails || recipientEmails.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No recipients provided'
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.email.email,
          pass: config.email.password,
        }
      });

      
      recipientEmails.forEach(async (recipientEmail) => {
        const mailOptions = {
          from: `${senderName} <${config.email.email}>`,
          replyTo: senderEmail,
          to: recipientEmail,
          subject: 'Invoice Document',
          text: 'Please find the attached invoice document.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="margin-bottom: 20px;">
                <p>Dear Recipient,</p>
                <p>Please find the attached invoice document for your reference.</p>
              </div>
              
              <div style="margin-bottom: 20px;">
                <p>Best regards,<br>${senderName}</p>
              </div>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Sent from Sushi Invoice</p>
              </div>

              <div style="background: linear-gradient(to right, #ff3b30, #000); padding: 30px 20px; border-radius: 8px; color: #fff; text-align: center; margin-bottom: 30px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="display: inline-block; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #fff;">
                    <span style="color: #fff;">Sushi</span>
                    <span style="color: #ff3b30;">.</span>
                    <span style="color: #fff;">Invoice</span>
                  </div>
                  <p style="margin-top: 10px; font-style: italic; font-size: 14px;">Complete eInvoicing Solution</p>
                </div>
                
                <div style="text-align: center; font-size: 14px;">
                  <p>Contact us: <a href="mailto:sushi.invoice@gmail.com" style="color: #007bff; text-decoration: none;">sushi.invoice@gmail.com</a></p>
                </div>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice-${invoiceId}.xml`,
              content: invoice,
              contentType: 'application/xml'
            }
          ]
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
          } else {
            console.log('Email sent:', info.response);
            return res.status(200).json({
              status: 'success',
              message: 'Email sent successfully'
            });
          }
        });
      });

    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send email',
        details: error.message
      });
    }
  }
};

module.exports = {
  invoiceController,
  parseXML
};
