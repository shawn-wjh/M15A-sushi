const { v4: uuidv4 } = require('uuid');

/**
 * UBL 2.4 XML Generation and Validation
 */

const generateUBLInvoice = (req, res, next) => {
    try {
        const invoice = req.validatedInvoice;
        const invoiceId = uuidv4();

        // Create UBL 2.4 XML structure
        const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.4</cbc:UBLVersionID>
    <cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>
    <cbc:ID>${invoiceId}</cbc:ID>
    <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
    <cbc:DueDate>${invoice.dueDate}</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${invoice.supplierName}</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${invoice.buyerName}</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    ${generateItemsXml(invoice.items)}
    
    <cac:LegalMonetaryTotal>
        <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.payableAmount}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
</Invoice>`;

        // Attach generated XML to request for next middleware
        req.generatedInvoice = {
            id: invoiceId,
            xml: ublXml,
            metadata: {
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate,
                supplierName: invoice.supplierName,
                buyerName: invoice.buyerName,
                amount: invoice.payableAmount,
                currency: invoice.currency
            }
        };

        next();
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error generating UBL invoice',
            details: error.message
        });
    }
};

const validateUBLFormat = (req, res, next) => {
    try {
        const { xml } = req.body;

        if (!xml) {
            return res.status(400).json({
                status: 'error',
                message: 'No XML content provided'
            });
        }

        // Basic XML structure validation
        if (!xml.includes('Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"')) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid UBL format: Missing required UBL namespace'
            });
        }

        // TODO: Add more detailed UBL 2.4 schema validation
        // This would typically involve validating against the official UBL 2.4 XSD schema

        // If validation passes, attach XML to request for next middleware
        req.validatedXml = xml;
        next();
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error validating UBL format',
            details: error.message
        });
    }
};

// Helper function to generate XML for invoice items
const generateItemsXml = (items) => {
    if (!items || !Array.isArray(items)) return '';

    return items.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity>${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${item.currency}">${item.quantity * item.unitPrice}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>${item.description}</cbc:Description>
            <cbc:Name>${item.description}</cbc:Name>
            <cac:Price>
                <cbc:PriceAmount currencyID="${item.currency}">${item.unitPrice}</cbc:PriceAmount>
            </cac:Price>
        </cac:Item>
    </cac:InvoiceLine>`).join('');
};

module.exports = {
    generateUBLInvoice,
    validateUBLFormat
}; 