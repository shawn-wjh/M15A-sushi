const convert = require('xml-js');
const { uploadToS3 } = require('./s3-helpers');
const { invoiceId } = require('./mockInvoice');

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
 paymentAccountId: "DK1212341234123412",
 paymentAccountName: "payment account name",
 financialInstitutionBranchId: "DKDKABCD",
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
  try {
    // Create base XML structure with required fields
    const ublXML = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'UTF-8'
        }
      },
      Invoice: {
        _attributes: {
          xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          'xmlns:cac':
            'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
          'xmlns:cbc':
            'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
          'xmlns:ext':
            'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
        },
        'cbc:CustomizationID': {
          _text:
            'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'
        },
        'cbc:ProfileID': {
          _text: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'
        },
        'cbc:DocumentCurrencyCode': { _text: invoice.currency || 'AUD' },
        'cac:OrderReference': {
          'cbc:ID': { _text: 'N/A' } // An identifier of a referenced purchase order, issued by the Buyer.
        },
        'cac:InvoiceDocumentReference': {
          'cbc:ID': { _text: 'N/A' } // Preceding Invoice number -- The identification of an Invoice that was previously sent by the Seller.
        },
        'cbc:ID': { _text: invoice.invoiceId },
        'cbc:IssueDate': { _text: invoice.issueDate },
        ...(invoice.dueDate && { 'cbc:DueDate': { _text: invoice.dueDate } }),
        'cbc:InvoiceTypeCode': { _text: '380' },

        // Required Supplier Party with optional fields
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cac:PartyName': { 'cbc:Name': { _text: invoice.supplier } },
            ...(invoice.supplierAddress && {
              'cac:PostalAddress': {
                ...(invoice.supplierAddress.street && {
                  'cbc:StreetName': { _text: invoice.supplierAddress.street }
                }),
                ...(invoice.supplierAddress.country && {
                  'cac:Country': {
                    'cbc:IdentificationCode': {
                      _text: invoice.supplierAddress.country
                    }
                  }
                })
              }
            }),
            'cac:Contact': {
              'cbc:Telephone': { _text: invoice.supplierPhone },
              'cbc:ElectronicMail': { _text: invoice.supplierEmail },
              'cbc:Name': { _text: invoice.supplier }
            }
          }
        },

        // Required Buyer Party with optional fields
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cac:PartyName': { 'cbc:Name': { _text: invoice.buyer } },
            ...(invoice.buyerAddress && {
              'cac:PostalAddress': {
                ...(invoice.buyerAddress.street && {
                  'cbc:StreetName': { _text: invoice.buyerAddress.street }
                }),
                ...(invoice.buyerAddress.country && {
                  'cac:Country': {
                    'cbc:IdentificationCode': {
                      _text: invoice.buyerAddress.country
                    }
                  }
                })
              }
            }),
            'cac:Contact': {
              ...(invoice.buyerPhone && {
                'cbc:Telephone': { _text: invoice.buyerPhone }
              }),
              'cbc:ElectronicMail': { _text: invoice.buyerEmail },
              'cbc:Name': { _text: invoice.buyer }
            }
          }
        },

        // Required Payment Means
        'cac:PaymentMeans': {
          'cac:PayeeFinancialAccount': {
            'cbc:ID': { _text: invoice.paymentAccountId },
            'cbc:Name': { _text: invoice.paymentAccountName },
            'cac:FinancialInstitutionBranch': {
              'cbc:ID': { _text: invoice.financialInstitutionBranchId }
            }
          }
        },

        // Required Total Amount
        'cac:LegalMonetaryTotal': {
          'cbc:PayableAmount': {
            _attributes: { currencyID: invoice.currency || 'AUD' },
            _text: invoice.total.toString()
          }
        },

        // Required Invoice Line Items
        'cac:InvoiceLine': invoice.items.map((item, index) => ({
          'cbc:ID': { _text: (index + 1).toString() },
          'cac:Item': {
            'cbc:Name': { _text: item.name },
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': { _text: 'S' } // either S = Standard rate or Z = Zero rated goods
            }
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              _attributes: {
                currencyID: item.currency || invoice.currency || 'AUD'
              },
              _text: item.cost.toString()
            },
            'cbc:BaseQuantity': {
              _attributes: { unitCode: 'EA' },
              _text: item.count.toString()
            }
          }
        }))
      }
    };

    // Convert JSON to XML
    const xmlBody = convert.js2xml(ublXML, {
      compact: true,
      spaces: 2,
      fullTagEmptyElement: true
    });

    return xmlBody;
  } catch (error) {
    throw new Error(`Failed to convert to UBL invoice: ${error.message}`);
  }
}

/**
 * Generate and upload UBL invoice given invoice data as js object
 * Currently not used; for the upload of invoices to S3
 */
// async function generateAndUploadUBLInvoice(invoiceData, invoiceId) {
//   try {
//     const ublXml = convertToUBL(invoiceData);
//     const uploadResult = await uploadToS3(ublXml, invoiceId);
//     return uploadResult;
//   } catch (error) {
//     throw new Error(`Failed to generate and upload UBL invoice: ${error.message}`);
//   }
// }

module.exports = {
  convertToUBL
  // generateAndUploadUBLInvoice
};
