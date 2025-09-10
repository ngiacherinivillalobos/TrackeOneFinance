#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Applying payment date migrations...');

try {
  // Apply SQLite migration by running the shell script
  console.log('Applying SQLite migration...');
  execSync('sh apply_all_migrations.sh', { cwd: path.resolve(__dirname), stdio: 'inherit' });
  
  // Apply PostgreSQL migration
  console.log('Applying PostgreSQL migration...');
  execSync('node apply_postgres_migrations.js', { cwd: path.resolve(__dirname), stdio: 'inherit' });
  
  console.log('✅ Payment date migrations applied successfully!');
} catch (error) {
  console.error('❌ Error applying migrations:', error.message);
  process.exit(1);
}