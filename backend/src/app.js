const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

// Import routes
const invoiceRoutes = require('./routes/invoice.routes');
const userRoutes = require('./routes/user.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],  // Allow frontend origins
  credentials: true,  // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Use routes
app.use('/v1/invoices', invoiceRoutes);
app.use('/v1/users', userRoutes);

// Handle 404 routes (when the user sends a request to a route that doesn't exist)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Export for testing purposes
module.exports = app;
