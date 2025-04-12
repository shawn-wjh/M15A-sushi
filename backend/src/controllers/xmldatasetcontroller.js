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

// Helper: Convert invoice object back to XML string
const convertToXml = (invoice) => {
  const builder = new xml2js.Builder({
    renderOpts: { pretty: true, indent: '  ' },
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  });
  return builder.buildObject({ Invoice: invoice });
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
    
    // Map each invoice into a DynamoDB PutRequest item
    const items = await Promise.all(invoices.map(async (invoice) => {
      const invoiceId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Convert invoice object back to XML string
      const invoiceXml = convertToXml(invoice);

      return {
        PutRequest: {
          Item: {
            InvoiceID: invoiceId,
            timestamp,
            UserID: req.user.userId,
            invoice: invoiceXml, // Store as XML string
          }
        }
      };
    }));
    
    // DynamoDB BatchWriteCommand limits to 25 items per request
    const batches = partitionArray(items, 25);
    
    // Write each batch to the table
    for (const batch of batches) {
      const params = {
        RequestItems: {
          [Tables.INVOICES]: batch
        }
      };
      await dbClient.send(new BatchWriteCommand(params));
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'XML dataset uploaded successfully',
      recordsUploaded: items.length
    });
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
