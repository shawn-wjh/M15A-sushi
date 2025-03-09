const config = require('./index');

const authConfig = {
  jwt: {
    // JWT configuration
    secret: config.jwt.secret,
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
    // What we'll include in the token
    tokenPayload: {
      includedFields: ['userId', 'email', 'role']
    }
  },

  password: {
    // Password hashing configuration
    saltRounds: 10,
    minLength: 8,
    requirements: {
      minUppercase: 1,
      minNumbers: 1,
      minSpecialChars: 1
    }
  },

  session: {
    // Cookie and session settings
    cookieName: 'auth_token',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
    sameSite: 'strict'
  },

  // Login attempt security
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 30 * 60 * 1000 // 30 minutes
  }
};

module.exports = authConfig;
