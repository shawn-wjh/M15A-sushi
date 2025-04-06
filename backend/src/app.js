const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load environment variables from .env file
dotenv.config();

// Import routes
const invoiceRoutes = require('./routes/invoice.routes');
const v2InvoiceRoutes = require('./routes/v2.invoice.routes');
const userRoutes = require('./routes/user.routes');
const healthRoutes = require('./routes/health.routes');
const orderRoutes = require('./routes/order.routes');
const currencyRoutes = require('./routes/currency.routes');

// Create Express app
const app = express();

// Load Swagger YAML
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3001', 'http://localhost:5173'];

// In production, also allow the current origin
if (process.env.NODE_ENV === 'production') {
  corsOrigins.push(process.env.APP_URL || '*');
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.indexOf('*') !== -1) {
      return callback(null, true);
    } else {
      return callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,  // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (for form data)

// Health check route
app.use('/health', healthRoutes);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Use routes
app.use('/v1/invoices', invoiceRoutes);
app.use('/v2/invoices', v2InvoiceRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/admin/orders', orderRoutes);
app.use('/v1/currency', currencyRoutes);

// Serve frontend static files
app.use(express.static(path.resolve(__dirname, '../../public')));

// Serve frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../public/index.html'));
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
