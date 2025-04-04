const convert = require('xml-js');
// const { uploadToS3 } = require('./s3-helpers');
// const { invoiceId } = require('./mockInvoice');

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
    console.log('Converting invoice to UBL:', JSON.stringify(invoice, null, 2));

    // Ensure numeric values are properly formatted
    const total = parseFloat(invoice.total) || 0;
    const taxTotal = parseFloat(invoice.taxTotal) || 0;
    const taxRate = parseFloat(invoice.taxRate) || 0;

    // Format items if they exist
    const formattedItems = invoice.items ? invoice.items.map(item => ({
      ...item,
      count: parseFloat(item.count) || 0,
      cost: parseFloat(item.cost) || 0,
      taxRate: parseFloat(item.taxRate) || taxRate || 0
    })) : [];

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
          _text: invoice.customizationId || 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'
        },
        'cbc:ProfileID': {
          _text: invoice.profileId || 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'
        },
        'cbc:DocumentCurrencyCode': { _text: invoice.currency || 'AUD' },
        'cac:OrderReference': {
          'cbc:ID': { _text: invoice.orderReferenceId || 'N/A' }
        },
        'cac:InvoiceDocumentReference': {
          'cbc:ID': { _text: invoice.invoiceDocumentReferenceId || 'N/A' }
        },
        'cbc:ID': { _text: invoice.invoiceId },
        'cbc:IssueDate': { _text: invoice.issueDate },
        ...(invoice.dueDate && { 'cbc:DueDate': { _text: invoice.dueDate } }),
        'cbc:InvoiceTypeCode': { _text: invoice.invoiceTypeCode || '380' },

        // Optional Supplier Party
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
              ...(invoice.supplierPhone && {
                'cbc:Telephone': { _text: invoice.supplierPhone }
              }),
              ...(invoice.supplierEmail && {
                'cbc:ElectronicMail': { _text: invoice.supplierEmail }
              }),
              ...(invoice.supplier && {
                'cbc:Name': { _text: invoice.supplier }
              })
            }
          }
        },

        // Optional Buyer Party
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
              ...(invoice.buyerEmail && {
                'cbc:ElectronicMail': { _text: invoice.buyerEmail }
              }),
              ...(invoice.buyer && {
                'cbc:Name': { _text: invoice.buyer }
              })
            }
          }
        },

        // Optional Payment Means
        'cac:PaymentMeans': {
          'cac:PayeeFinancialAccount': {
            ...(invoice.paymentAccountId && {
              'cbc:ID': { _text: invoice.paymentAccountId }
            }),
            ...(invoice.paymentAccountName && {
              'cbc:Name': { _text: invoice.paymentAccountName }
            }),
            ...(invoice.financialInstitutionBranchId && {
              'cac:FinancialInstitutionBranch': {
                'cbc:ID': { _text: invoice.financialInstitutionBranchId }
              }
            })
          }
        },

        // Optional Total Amount
        'cac:LegalMonetaryTotal': {
          'cbc:PayableAmount': {
            _attributes: { currencyID: invoice.currency || 'AUD' },
            _text: total.toString()
          }
        },

        // Optional Invoice Line Items
        'cac:InvoiceLine': formattedItems.map((item, index) => ({
          'cbc:ID': { _text: (index + 1).toString() },
          'cac:Item': {
            'cbc:Name': { _text: item.name },
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': { _text: item.taxCategory || 'S' },
              'cbc:Percent': { _text: item.taxRate.toString() }
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
              _attributes: { unitCode: item.unitCode || 'EA' },
              _text: item.count.toString()
            }
          }
        })),
        
        // Add TaxTotal element
        'cac:TaxTotal': {
          'cbc:TaxAmount': {
            _attributes: {
              currencyID: invoice.currency || 'AUD'
            },
            _text: taxTotal.toString()
          },
          'cbc:Percent': { _text: taxRate.toString() }
        }
      }
    };

    // Convert JSON to XML
    const xmlBody = convert.js2xml(ublXML, {
      compact: true,
      spaces: 2,
      fullTagEmptyElement: true
    });

    console.log('Generated UBL XML:', xmlBody);
    return xmlBody;
  } catch (error) {
    console.error('Error converting to UBL:', error);
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
  