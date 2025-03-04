const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
// when user sends a JSON request, express.json() will parse the JSON body and attach it to the request object (req.body)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Basic health check route
app.get('/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

const invoiceRoutes = require('./routes/invoice.routes');
app.use('/v1/invoices', invoiceRoutes);
// const invoiceRoutes = require('./routes/invoice.routes');

// Use routes
// app.use('/v1/invoices', invoiceRoutes);

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

const PORT = process.env.PORT || 3000;

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for testing purposes
module.exports = app;
