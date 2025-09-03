import { Pool, QueryResult } from 'pg';
// Adicionando declaração de módulo para resolver problema de tipos
// @ts-ignore
declare module 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Verifica se estamos em ambiente de produção (Render)
const isProduction = process.env.NODE_ENV === 'production';

type Database = Pool | sqlite3.Database;

let db: Database;
let sqliteDb: sqlite3.Database;

// Funções wrapper para abstrair as diferenças entre SQLite e PostgreSQL
const dbGet = (db: Database, query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL - convert ? placeholders to $1, $2, etc.
      const pgQuery = query.replace(/\?/g, (match, offset, str) => {
        // Count number of ? characters before this one
        const upToOffset = str.substring(0, offset);
        const questionMarkCount = (upToOffset.match(/\?/g) || []).length;
        return `$${questionMarkCount + 1}`;
      });
      
      console.log(`Executando query PostgreSQL [get]: ${pgQuery}`);
      console.log('Parâmetros:', params);
      
      (db as Pool).query(pgQuery, params)
        .then((result: QueryResult) => {
          console.log(`Query PostgreSQL [get] bem-sucedida, retornando ${result.rows.length > 0 ? '1' : '0'} registro`);
          resolve(result.rows[0]);
        })
        .catch((err: Error) => {
          console.error('Erro ao executar query PostgreSQL [get]:', err);
          reject(err);
        });
    } else {
      // SQLite
      console.log(`Executando query SQLite [get]: ${query}`);
      console.log('Parâmetros:', params);
      
      (db as sqlite3.Database).get(query, params, (err: Error | null, row: any) => {
        if (err) {
          console.error('Erro ao executar query SQLite [get]:', err);
          reject(err);
        } else {
          console.log(`Query SQLite [get] bem-sucedida, retornando ${row ? '1' : '0'} registro`);
          resolve(row);
        }
      });
    }
  });
};

const dbRun = (db: Database, query: string, params: any[] = []): Promise<{ lastID?: number, changes?: number }> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL - convert ? placeholders to $1, $2, etc.
      const pgQuery = query.replace(/\?/g, (match, offset, str) => {
        // Count number of ? characters before this one
        const upToOffset = str.substring(0, offset);
        const questionMarkCount = (upToOffset.match(/\?/g) || []).length;
        return `$${questionMarkCount + 1}`;
      });
      
      (db as Pool).query(pgQuery, params)
        .then((result: QueryResult) => {
          resolve({ 
            lastID: result.rows.length > 0 ? result.rows[0].id : undefined,
            changes: result.rowCount !== null ? result.rowCount : undefined
          });
        })
        .catch((error: Error) => reject(error));
    } else {
      // SQLite
      (db as sqlite3.Database).run(query, params, function(this: any, err: Error | null) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

const dbAll = (db: Database, query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // PostgreSQL - convert ? placeholders to $1, $2, etc.
      const pgQuery = query.replace(/\?/g, (match, offset, str) => {
        // Count number of ? characters before this one
        const upToOffset = str.substring(0, offset);
        const questionMarkCount = (upToOffset.match(/\?/g) || []).length;
        return `$${questionMarkCount + 1}`;
      });
      
      console.log(`Executando query PostgreSQL [all]: ${pgQuery}`);
      console.log('Parâmetros:', params);
      
      (db as Pool).query(pgQuery, params)
        .then((result: QueryResult) => {
          console.log(`Query PostgreSQL [all] bem-sucedida, retornando ${result.rows.length} registros`);
          resolve(result.rows);
        })
        .catch((err: Error) => {
          console.error('Erro ao executar query PostgreSQL [all]:', err);
          reject(err);
        });
    } else {
      // SQLite
      console.log(`Executando query SQLite [all]: ${query}`);
      console.log('Parâmetros:', params);
      
      // Adicionar log para verificar a query final com parâmetros
      let finalQuery = query;
      params.forEach((param, index) => {
        finalQuery = finalQuery.replace('?', `'${param}'`);
      });
      console.log('Query final com parâmetros:', finalQuery);
      
      (db as sqlite3.Database).all(query, params, (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Erro ao executar query SQLite [all]:', err);
          reject(err);
        } else {
          console.log(`Query SQLite [all] bem-sucedida, retornando ${rows?.length || 0} registros`);
          console.log('Registros retornados:', rows);
          resolve(rows || []);
        }
      });
    }
  });
};

const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // Em produção, usa PostgreSQL
      console.log('Iniciando conexão com PostgreSQL...');
      console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sim' : 'Não');
      
      try {
        db = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        // Testar a conexão com o banco
        (db as Pool).query('SELECT NOW()', [])
          .then((result: QueryResult) => {
            console.log('Conexão com PostgreSQL testada com sucesso:', result.rows[0]);
            
            // Verificar se as tabelas existem e criá-las se necessário
            initializePostgreSQLTables(db as Pool)
              .then(() => resolve())
              .catch((error: Error) => {
                console.error('Erro ao inicializar tabelas PostgreSQL:', error);
                reject(error);
              });
          })
          .catch((error: Error) => {
            console.error('Erro ao testar conexão com PostgreSQL:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Erro ao criar pool de conexão PostgreSQL:', error);
        reject(error);
      }
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

// Função para inicializar tabelas no PostgreSQL
const initializePostgreSQLTables = async (pool: Pool): Promise<void> => {
  console.log('Verificando e criando tabelas no PostgreSQL se necessário...');
  
  // Verificar se a tabela payment_details existe
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_details'
      )
    `);
    
    const tableExists = result.rows[0].exists;
    console.log('Tabela payment_details existe:', tableExists);
    
    if (!tableExists) {
      console.log('Criando tabela payment_details...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_details (
          id SERIAL PRIMARY KEY,
          transaction_id INTEGER NOT NULL,
          payment_date DATE NOT NULL,
          paid_amount DECIMAL(10,2) NOT NULL,
          original_amount DECIMAL(10,2) NOT NULL,
          payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('bank_account', 'credit_card')),
          bank_account_id INTEGER,
          card_id INTEGER,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          interest_amount DECIMAL(10,2) DEFAULT 0,
          observations TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
          FOREIGN KEY (card_id) REFERENCES cards(id)
        )
      `);
      console.log('Tabela payment_details criada com sucesso');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela payment_details:', error);
    throw error;
  }
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