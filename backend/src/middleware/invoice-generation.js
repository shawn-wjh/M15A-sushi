const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const convert = require("xml-js");
const config = require("../config");

/**
 * Example invoice data in js format
 * ALL FIELDS REQUIRED FOR v1.0
 * 
const exampleInvoice = {
 invoiceId: "INV001",
 total: 350,
 buyer: "John Doe",
 supplier: "XYZ Corp",
 issueDate: "2025-03-05",
 dueDate: "2025-03-10",
 currency: "AUD",
 buyerAddress: { street: "123 Main St", country: "AU" },
 buyerPhone: "+1234567890",
 items: [
   { name: "Item A", count: 2, cost: 100 },
   { name: "Item B", count: 3, cost: 50 },
 ],
};
*/

/**
 * Converts invoice data in JSON format to UBL XML format, by filling out a 
 * template using fields provided in the JSON object.
 *
 * @param {object} invoice - refer to exampleInvoice above
 * @returns {string} UBL XML string
 */
function convertToUBL(invoice) {
  const ublXML = {
    Invoice: {
      _attributes: {
        xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        "xmlns:cac":
          "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
        "xmlns:cbc":
          "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      },
      "cbc:ID": invoice.invoiceId,
      "cbc:IssueDate": invoice.issueDate,
      "cbc:DueDate": invoice.dueDate,
      "cbc:InvoiceTypeCode": "380", // Example code for invoice

      // Supplier Party
      "cac:AccountingSupplierParty": {
        "cac:Party": {
          "cac:PartyName": { "cbc:Name": invoice.supplier },
          "cac:PostalAddress": {
            "cbc:StreetName": invoice.buyerAddress.street,
            "cac:Country": {
              "cbc:IdentificationCode": invoice.buyerAddress.country,
            },
          },
          "cac:Contact": { "cbc:Telephone": invoice.buyerPhone },
        },
      },

      // Buyer Party
      "cac:AccountingCustomerParty": {
        "cac:Party": {
          "cac:PartyName": { "cbc:Name": invoice.buyer },
          "cac:PostalAddress": {
            "cbc:StreetName": invoice.buyerAddress.street,
            "cac:Country": {
              "cbc:IdentificationCode": invoice.buyerAddress.country,
            },
          },
          "cac:Contact": { "cbc:Telephone": invoice.buyerPhone },
        },
      },

      // Total Amount
      "cac:LegalMonetaryTotal": {
        "cbc:PayableAmount": {
          _attributes: { currencyID: invoice.currency },
          _text: invoice.total,
        },
      },

      // Invoice Line Items
      "cac:InvoiceLine": invoice.items.map((item, index) => ({
        "cbc:ID": index + 1,
        "cac:Item": { "cbc:Name": item.name },
        "cac:Price": {
          "cbc:PriceAmount": {
            _attributes: { currencyID: item.currency },
            _text: item.cost,
          },
          "cbc:BaseQuantity": {
            _attributes: { unitCode: "EA" }, // defualt unit code 'each'
            _text: item.count,
          },
        },
      })),
    },
  };

  // Convert JSON to XML
  const xmlBody = convert.js2xml(ublXML, {
    compact: true,
    spaces: 4,
  });

  // Prepend the XML declaration
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}

/**
 * Upload UBL XML to S3 bucket
 */

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.credentials.accessKeyId,
    secretAccessKey: config.aws.credentials.secretAccessKey,
  },
  endpoint: `https://s3.${config.aws.region}.amazonaws.com`,
});

async function uploadToS3(xml, invoiceId) {
  try {
    const params = {
      Bucket: config.s3.bucketName || 'sushi-invoice-storage',
      Key: `invoices/${invoiceId}.xml`,
      Body: xml,
      ContentType: "application/xml",
    };

    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);

    return {
      success: true,
      location: `s3://sushi-invoice-storage/invoices/${invoiceId}.xml`,
      response,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Generate and upload UBL invoice given invoice data as js object
 */
async function generateAndUploadUBLInvoice(invoiceData, invoiceId) {
  const ublXml = convertToUBL(invoiceData);
  const uploadResult = await uploadToS3(ublXml, invoiceId);
  return uploadResult;
}

module.exports = generateAndUploadUBLInvoice;