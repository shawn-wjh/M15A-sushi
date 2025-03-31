const express = require('express');
const router = express.Router();

/**
 * Health check endpoint for Elastic Beanstalk
 * @route GET /health
 * @returns {object} 200 - Service status
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Service is up and running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router; 