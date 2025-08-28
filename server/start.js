#!/usr/bin/env node

// Import ts-node/register to handle TypeScript
require('ts-node/register');

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

try {
  // Import and start the server
  require('./src/server.ts');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
