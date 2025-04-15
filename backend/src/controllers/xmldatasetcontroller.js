const { v4: uuidv4 } = require('uuid');
const { createDynamoDBClient, Tables } = require('../config/database');
const { BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const xml2js = require('xml2js');

// Initialize DynamoDB client
const dbClient = createDynamoDBClient();

// Helper: Partition items into chunks (batch size is 25 for DynamoDB BatchWrite)
const partitionArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

/**
 * Upload an XML dataset and store each record in DynamoDB.
 * Expects validated invoices to be attached to req.validatedInvoices by the validateXmlInvoices middleware.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const uploadXMLDataset = async (req, res) => {
  try {
    // Get the validated invoices from the middleware
    const invoices = req.validatedInvoices;
    if (!invoices || !Array.isArray(invoices)) {
      return res.status(400).json({
        status: 'error',
        message: 'No validated invoices found'
      });
    }
    
    // Important: Store the original XML string to preserve namespace prefixes
    const originalXml = req.body.xmlDataset;
    
    // Check if we have a single invoice or multiple
    const isSingleInvoice = invoices.length === 1;
    
    // For single invoice, we can store the original XML directly
    if (isSingleInvoice) {
      console.log('Processing single invoice for upload');
      
      const invoiceId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Extract invoice number for reference
      const invoice = invoices[0];
      const invoiceNumber = invoice.ID && invoice.ID._ ? invoice.ID._ : 
                           (invoice.ID || `Generated-${invoiceId.substr(0, 8)}`);
      
      // Store the invoice in DynamoDB
      const params = {
        RequestItems: {
          [Tables.INVOICES]: [
            {
              PutRequest: {
                Item: {
                  InvoiceID: invoiceId,
                  timestamp,
                  UserID: req.user.userId,
                  invoice: originalXml, // Store the original XML to preserve namespace prefixes
                  invoiceNumber: invoiceNumber
                }
              }
            }
          ]
        }
      };
      
      await dbClient.send(new BatchWriteCommand(params));
      
      return res.status(200).json({
        status: 'success',
        message: 'XML invoice uploaded successfully',
        recordsUploaded: 1
      });
    } else {
      // For multiple invoices, we need to extract each one
      // This gets more complex - we would need to extract each invoice from the XML
      // For now, we'll use a simplified approach that will only work for single invoices
      return res.status(400).json({
        status: 'error',
        message: 'Multiple invoice upload is not yet supported with namespace preservation. Please upload invoices one at a time.'
      });
    }
  } catch (error) {
    console.error('Error uploading XML dataset:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to upload XML dataset',
      details: error.message
    });
  }
};

module.exports = { uploadXMLDataset };
