/**
 * Server entry point for the Invoice Management System
 * This file handles server initialization, database connection setup,
 * and graceful shutdown procedures.
 */
const http = require('http');
const app = require('./app');
const { createDynamoDBClient } = require('./config/database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize database connection
const dbClient = createDynamoDBClient();

// Set port
const PORT = process.env.PORT || 3000;
app.set('port', PORT);

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT);

// Event listeners for server
server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Server listening on ${bind}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log API documentation URL if in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  }
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/**
 * Graceful shutdown function
 * Closes server and database connections
 */
function gracefulShutdown() {
  console.log('Starting graceful shutdown...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections or other resources here
    console.log('All connections closed');
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after timeout if graceful shutdown fails
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
} 