/**
 * Migration para adicionar suporte a autenticação em dois fatores (2FA)
 * Este script adiciona as colunas necessárias à tabela de usuários
 * para armazenar a configuração de TOTP.
 */

const sqlite3 = require('sqlite3').verbose();
const postgres = require('pg');
const path = require('path');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/dev.db');

async function migrateDatabase() {
  if (DB_TYPE === 'postgres') {
    await migratePostgres();
  } else {
    await migrateSqlite();
  }
}

function migrateSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      // Verificar se as colunas já existem
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
          console.error('Erro ao verificar schema:', err);
          reject(err);
          return;
        }

        const hasColumn = (colName) => rows.some(row => row.name === colName);
        const hasTwo2faEnabled = hasColumn('two_factor_enabled');
        const hasTwoFactorSecret = hasColumn('two_factor_secret');

        if (hasTwo2faEnabled && hasTwoFactorSecret) {
          console.log('✅ Colunas de 2FA já existem na tabela users');
          db.close();
          resolve();
          return;
        }

        // Adicionar colunas se não existirem
        const statements = [];

        if (!hasTwo2faEnabled) {
          statements.push(`
            ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0
          `);
        }

        if (!hasTwoFactorSecret) {
          statements.push(`
            ALTER TABLE users ADD COLUMN two_factor_secret TEXT
          `);
        }

        // Executar alterações
        statements.forEach((sql) => {
          db.run(sql, (err) => {
            if (err) {
              console.error('Erro ao executar SQL:', err);
              console.error('SQL:', sql);
            }
          });
        });

        db.run('PRAGMA foreign_keys=ON', () => {
          console.log('✅ Migration SQLite completada com sucesso');
          db.close();
          resolve();
        });
      });
    });
  });
}

async function migratePostgres() {
  const client = new postgres.Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'trackone_finance'
  });

  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // Verificar se as colunas já existem
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name IN ('two_factor_enabled', 'two_factor_secret')
    `);

    const existingColumns = result.rows.map(row => row.column_name);
    const statements = [];

    if (!existingColumns.includes('two_factor_enabled')) {
      statements.push('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false');
    }

    if (!existingColumns.includes('two_factor_secret')) {
      statements.push('ALTER TABLE users ADD COLUMN two_factor_secret TEXT');
    }

    // Executar alterações
    for (const sql of statements) {
      try {
        await client.query(sql);
        console.log(`✅ Executado: ${sql}`);
      } catch (err) {
        if (err.code === '42701') {
          // Coluna já existe
          console.log(`⚠️  Coluna já existe: ${err.message}`);
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Migration PostgreSQL completada com sucesso');
    await client.end();
  } catch (error) {
    console.error('Erro na migration PostgreSQL:', error);
    throw error;
  }
}

migrateDatabase()
  .then(() => {
    console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao aplicar migrations:', error);
    process.exit(1);
  });
