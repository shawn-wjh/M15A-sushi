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
    return res.status(500).json({
      status: 'error',
      message: 'PDF export not implemented yet'
    });
  },

  exportInvoiceCSV: async (req, res) => {
    return res.status(500).json({
      status: 'error',
      message: 'CSV export not implemented yet'
    });
  }
};

module.exports = exportController;
