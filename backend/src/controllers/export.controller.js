const { jsPDF } = require('jspdf');
const { schemaNameMap } = require('../utils/schemaNameMap');
const pdfLayout = require('../models/pdfExportLayout');
const csvLayout = require('../models/csvExportLayout');
const { errorMonitor } = require('nodemailer/lib/xoauth2');

const exportController = {
  exportInvoiceXML: async (req, res) => {
    console.log("exportInvoiceXML called");
    try {
      // The XML content should be available from the getInvoice middleware
      const xml = req.body.xml;
      
      if (!xml) {
        return res.status(400).json({
          status: 'error',
          message: 'No XML content found'
        });
      }

      // Set headers for file download  
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.invoiceid}.xml`);
      
      // Send the XML content
      return res.status(200).send(xml);
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to export invoice as XML',
        details: error.message
      });
    }
  },

  exportInvoicePDF: async (req, res) => {
    console.log("exportInvoicePDF called");
    try {
      console.log("req:", req);
      const invoice = req.invoice.invoiceJson;
      console.log("Invoice data:", invoice);
      
      if (!invoice) {
        console.log("error in export controller:", invoice);
        return res.status(400).json({
          status: 'error',
          message: 'No invoice data found'
        });
      }

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Apply the PDF layout
      await pdfLayout(doc, invoice);
      
      // Get the PDF as a buffer
      const pdfBuffer = doc.output('arraybuffer');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.invoiceid}.pdf`);
      
      // Send the PDF buffer
      return res.status(200).send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('PDF generation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate PDF',
        details: error.message
      });
    }
  },

  exportInvoiceCSV: async (req, res) => {
    console.log("exportInvoiceCSV called");
    try {
      const invoice = req.invoice.invoiceJson;
      
      if (!invoice) {
        return res.status(400).json({
          status: 'error',
          message: 'No invoice data found'
        });
      }

      // Generate CSV content
      const csvContent = csvLayout(invoice);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.invoiceid}.csv`);
      
      // Send the CSV content
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('CSV generation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate CSV',
        details: error.message
      });
    }
  }
};

module.exports = exportController;
