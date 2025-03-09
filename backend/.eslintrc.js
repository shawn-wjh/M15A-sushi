module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Customize rules based on your preferences
    'no-console': 'off', // Allow console.log for backend
    'comma-dangle': ['error', 'never'],
    'linebreak-style': 'off',
    'max-len': ['error', { code: 120 }]
  }
};
