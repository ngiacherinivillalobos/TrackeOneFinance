import { Pool, QueryResult } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se estamos em ambiente de produção (Render)
const isProduction = process.env.NODE_ENV === 'production';

type Database = Pool | sqlite3.Database;

let db: Database;
let sqliteDb: sqlite3.Database;

// Funções wrapper para abstrair as diferenças entre SQLite e PostgreSQL
const dbAll = (db: Database, query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL
      (db as Pool).query(query, params)
        .then((result: QueryResult) => resolve(result.rows))
        .catch(reject);
    } else {
      // SQLite
      (db as sqlite3.Database).all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
};

const dbGet = (db: Database, query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL
      (db as Pool).query(query, params)
        .then((result: QueryResult) => resolve(result.rows[0]))
        .catch(reject);
    } else {
      // SQLite
      (db as sqlite3.Database).get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
};

const dbRun = (db: Database, query: string, params: any[] = []): Promise<{ lastID?: number, changes?: number }> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL
      (db as Pool).query(query, params)
        .then((result: QueryResult) => {
          resolve({ 
            lastID: result.rows.length > 0 ? result.rows[0].id : undefined,
            changes: result.rowCount !== null ? result.rowCount : undefined
          });
        })
        .catch(reject);
    } else {
      // SQLite
      (db as sqlite3.Database).run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // Em produção, usa PostgreSQL
      db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      console.log('Connected to PostgreSQL database');
      resolve();
    } else {
      // Em desenvolvimento, usa SQLite
      // Usar caminho absoluto para o banco de dados
      const dbPath = path.resolve(__dirname, '..', '..', '..', 'database', 'track_one_finance.db');
      console.log('Attempting to open SQLite database at:', dbPath);
      
      sqliteDb = new sqlite3.Database(dbPath, (err: Error | null) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database at:', dbPath);
          db = sqliteDb;
          resolve();
        }
      });
    }
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return {
    db,
    all: dbAll,
    get: dbGet,
    run: dbRun
  };
};

export { initializeDatabase, getDatabase };