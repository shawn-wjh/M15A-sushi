const { convertToUBL, generateAndUploadUBLInvoice, uploadToS3 } = require('./invoice-generation');
const mockInvoice = require('./mockInvoice');

jest.mock('@aws-sdk/client-s3');

describe('Invoice Generation Tests', () => {

    describe('convertToUBL', () => {
        it('should convert invoice data to valid UBL XML', () => {
            const result = convertToUBL(mockInvoice);
            expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(result).toContain('<Invoice');
            // Check that all invoice data is present in the XML
            expect(result).toContain(mockInvoice.invoiceId);
            expect(result).toContain(mockInvoice.total.toString());
            expect(result).toContain(mockInvoice.buyer);
            expect(result).toContain(mockInvoice.supplier);
            expect(result).toContain(mockInvoice.issueDate);
            expect(result).toContain(mockInvoice.dueDate);
            expect(result).toContain(mockInvoice.currency);
            expect(result).toContain(mockInvoice.buyerAddress.street);
            expect(result).toContain(mockInvoice.buyerAddress.country);
            expect(result).toContain(mockInvoice.buyerPhone);
            expect(result).toContain(mockInvoice.items[0].name);
            expect(result).toContain(mockInvoice.items[0].count.toString());
            expect(result).toContain(mockInvoice.items[0].cost.toString());
            expect(result).toContain(mockInvoice.items[1].name);
            expect(result).toContain(mockInvoice.items[1].count.toString());
            expect(result).toContain(mockInvoice.items[1].cost.toString());
        });
    });

    describe('uploadToS3', () => {
        it('should successfully upload XML to S3', async () => {
            const mockXml = '<?xml version="1.0"?><test></test>';
            const result = await uploadToS3(mockXml, 'test-id');
            expect(result.success).toBe(true);
            expect(result.location).toBe('s3://sushi-invoice-storage/invoices/test-id.xml');
        });

        it('should throw error on upload failure', async () => {
            const mockXml = '<?xml version="1.0"?><test></test>';
            jest.spyOn(console, 'error').mockImplementation(() => {});
            await expect(uploadToS3(null, 'test-id')).rejects.toThrow();
        });
    });

    describe('generateAndUploadUBLInvoice', () => {
        it('should generate and upload invoice successfully', async () => {
            const result = await generateAndUploadUBLInvoice(mockInvoice, mockInvoice.invoiceId);
            expect(result.success).toBe(true);
            expect(result.location).toContain(mockInvoice.invoiceId);
        });

        it('should throw error with invalid invoice data', async () => {
            const invalidInvoice = { ...mockInvoice, invoiceId: null };
            await expect(generateAndUploadUBLInvoice(invalidInvoice, invalidInvoice.invoiceId)).rejects.toThrow();
        });
    });

});