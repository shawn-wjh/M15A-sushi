// backend/src/routes/openai.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const openaiController = require('../controllers/openAI.controller');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../temp'));
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter files to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Route for creating invoice from text prompt
router.post('/text-to-invoice', openaiController.createInvoiceFromText);

// Route for creating invoice from image
router.post('/image-to-invoice', upload.single('image'), openaiController.createInvoiceFromImage);

module.exports = router;