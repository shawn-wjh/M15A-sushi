const express = require('express');
const router = express.Router();

// Import middleware
const auth = require('../middleware/auth');
const validateXmlInvoices = require('../middleware/validateXmlInvoices');

// Import controllers
const { uploadXMLDataset } = require('../controllers/xmldatasetcontroller');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

/**
 * Upload XML dataset
 * @route POST /v1/xml-dataset/upload
 * @param {string} req.body.xmlDataset - XML dataset string
 * @returns {object} 200 - Success response with number of records uploaded
 */
router.post('/upload', validateXmlInvoices, uploadXMLDataset);

module.exports = router; 