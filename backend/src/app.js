const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes
const invoiceRoutes = require('./routes/invoice.routes');
const userRoutes = require('./routes/user.routes');
const systemRoutes = require('./routes/system.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
// when user sends a JSON request, express.json() will parse the JSON body and attach it to the request object (req.body)
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Use routes
app.use('/v1/invoices', invoiceRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1', systemRoutes);

// Handle 404 routes (when the user sends a request to a route that doesn't exist)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Export for testing purposes
module.exports = app;
