import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(__dirname, '..', '..', '..', process.env.DATABASE_PATH || 'database/track_one_finance.db');

console.log('Database path:', dbPath);

let db: Database;

const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        resolve();
      }
    });
  });
};

const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export { initializeDatabase, getDatabase };
