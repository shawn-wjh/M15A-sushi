const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes
const invoiceRoutes = require('./routes/invoice.routes');
const userRoutes = require('./routes/user.routes');

// Create Express app
const app = express();

// supply swagger file
app.use('/swagger', express.static(path('../swagger.yaml')));

// Middleware
app.use(cors()); // Enable CORS for all routes
// when user sends a JSON request, express.json() will parse the JSON body and attach it to the request object (req.body)
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Use routes
app.use('/v1/invoices', invoiceRoutes);
app.use('/v1/users', userRoutes);

// Error handling middleware (When our function outputs errors)
// This is a global error handler that will help us debug errors in development
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404 routes (when the user sends a request to a route that doesn't exist)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Export for testing purposes
module.exports = app;
