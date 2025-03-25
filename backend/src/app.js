const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Import routes
const invoiceRoutes = require('./routes/invoice.routes');
const v2InvoiceRoutes = require('./routes/v2.invoice.routes');
const userRoutes = require('./routes/user.routes');
const systemRoutes = require('./routes/system.routes');
const healthRoutes = require('./routes/health.routes');

// Create Express app
const app = express();

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3001', 'http://localhost:5173'];

// Middleware
app.use(cors({
  origin: corsOrigins,  // Allow configured origins
  credentials: true,  // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Health check route (needs to be before auth to ensure it's always accessible)
app.use('/health', healthRoutes);

// Use routes
app.use('/v1/invoices', invoiceRoutes);
app.use('/v2/invoices', v2InvoiceRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1', systemRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
