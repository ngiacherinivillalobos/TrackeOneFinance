import fs from 'fs';
import path from 'path';
import { getDatabase } from './connection';

// Lista de migrações na ordem correta
const migrations = [
  // Migrações específicas para cada ambiente
  'add_payment_status_id_to_transactions_postgres.sql', // Apenas para produção
  'add_is_paid_to_transactions_postgres.sql', // Apenas para produção
  'add_payment_date_to_transactions_postgres.sql', // Apenas para produção
  'add_installment_fields_postgres.sql', // Apenas para produção
  'add_recurring_fields_postgres.sql', // Apenas para produção
  'add_investment_type_postgres.sql', // Apenas para produção
  'add_cost_center_to_users_postgres.sql', // Apenas para produção
  'add_cost_center_to_cash_flow_postgres.sql', // Apenas para produção
  'add_payment_days_to_cost_centers_postgres.sql', // Apenas para produção
  'sync_is_paid_with_payment_status_postgres.sql', // Apenas para produção
  'fix_payment_status_consistency_postgres.sql', // Apenas para produção
  'fix_boolean_values_postgres.sql', // Apenas para produção
  'add_missing_payment_fields_postgres.sql', // Apenas para produção
  'ensure_cost_centers_payment_days_postgres.sql', // Apenas para produção
  'create_credit_card_transactions_table_postgres.sql', // Apenas para produção
  'fix_cards_table_postgres.sql', // Apenas para produção
  'add_due_date_to_credit_card_transactions_postgres.sql', // Nova migração para PostgreSQL
  
  // Migrações para SQLite (desenvolvimento)
  'add_savings_goals_table.sql',
  'add_card_details_to_cards_table_sqlite.sql',
  'create_credit_card_transactions_table_sqlite.sql',
  'add_due_date_to_credit_card_transactions_sqlite.sql' // Nova migração para SQLite
];

// Função para aplicar uma migração
const applyMigration = async (migrationName: string) => {
  console.log(`Aplicando migração: ${migrationName}`);
  
  const migrationPath = path.join(__dirname, '..', '..', '..', 'database', 'migrations', migrationName);
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`Migração não encontrada: ${migrationPath}`);
    return;
  }
  
  const { db, all } = getDatabase();
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Para PostgreSQL, dividir o script em comandos separados
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Verificar se a migração é específica para o ambiente
  const isPostgresOnly = migrationName.includes('_postgres.');
  const isSqliteOnly = migrationName.includes('_sqlite.');
  
  // Pular migrações que não são para o ambiente atual
  if (isProduction && isSqliteOnly) {
    console.log(`Migração ${migrationName} é apenas para SQLite, pulando...`);
    return;
  }
  
  if (!isProduction && isPostgresOnly) {
    console.log(`Migração ${migrationName} é apenas para PostgreSQL, pulando...`);
    return;
  }
  
  if (isProduction) {
    // PostgreSQL - dividir em comandos separados
    const commands = migrationContent.split(';').filter(cmd => cmd.trim() !== '');
    
    for (const command of commands) {
      const cmd = command.trim();
      if (cmd !== '') {
        try {
          console.log(`Executando comando: ${cmd.substring(0, 100)}...`);
          // Usar a função all que já trata as diferenças entre PostgreSQL e SQLite
          await all(db, cmd);
        } catch (error: any) {
          // Ignorar erros de "já existe" mas logar outros erros
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate key') &&
              !error.message.includes('does not exist') &&
              !error.message.includes('column.*does not exist')) {
            console.error(`Erro ao executar comando: ${cmd.substring(0, 100)}...`, error);
            throw error;
          } else {
            console.log(`Comando ignorado (já existe): ${cmd.substring(0, 100)}...`);
          }
        }
      }
    }
  } else {
    // SQLite - executar como um bloco
    try {
      console.log(`Executando migração completa: ${migrationName}`);
      // Para SQLite, usar o método exec diretamente
      await new Promise<void>((resolve, reject) => {
        const sqlite3 = require('sqlite3');
        const dbPath = path.resolve(__dirname, '..', '..', '..', 'database', 'track_one_finance.db');
        const sqliteDb = new sqlite3.Database(dbPath);
        sqliteDb.exec(migrationContent, (err: Error | null) => {
          sqliteDb.close();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      console.error(`Erro ao aplicar migração ${migrationName}:`, error);
      throw error;
    }
  }
  
  console.log(`Migração ${migrationName} aplicada com sucesso`);
};

// Função principal para executar todas as migrações pendentes
export const runMigrations = async () => {
  console.log('=== EXECUTANDO MIGRAÇÕES ===');
  
  const { db, all, get, run } = getDatabase();
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    // Verificar se a tabela de migrações existe
    let tableExists = false;
    
    if (isProduction) {
      try {
        const result = await all(db, `
          SELECT table_name FROM information_schema.tables WHERE table_name='migrations'
        `);
        tableExists = result.length > 0;
      } catch (error) {
        tableExists = false;
      }
    } else {
      try {
        await get(db, `
          SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'
        `);
        tableExists = true;
      } catch (error) {
        tableExists = false;
      }
    }
    
    if (!tableExists) {
      // Criar tabela de migrações se não existir
      try {
        if (isProduction) {
          await all(db, `
            CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
        } else {
          await run(db, `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
      } catch (error) {
        console.error('Erro ao criar tabela de migrações:', error);
        // Ignorar erro se a tabela já existir
      }
    }
    
    // Aplicar cada migração na ordem
    for (const migrationName of migrations) {
      // Verificar se a migração já foi aplicada
      let isApplied = false;
      
      try {
        if (isProduction) {
          const result = await all(db, 
            'SELECT id FROM migrations WHERE name = $1',
            [migrationName]
          );
          isApplied = result.length > 0;
        } else {
          const result = await get(db, 
            'SELECT id FROM migrations WHERE name = ?',
            [migrationName]
          );
          isApplied = !!result;
        }
      } catch (error) {
        isApplied = false;
      }
      
      if (!isApplied) {
        console.log(`Migração pendente: ${migrationName}`);
        await applyMigration(migrationName);
        
        // Marcar como aplicada
        try {
          if (isProduction) {
            await all(db,
              'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
              [migrationName]
            );
          } else {
            await run(db,
              'INSERT OR IGNORE INTO migrations (name) VALUES (?)',
              [migrationName]
            );
          }
        } catch (error) {
          console.error('Erro ao marcar migração como aplicada:', error);
          // Ignorar erro se já estiver marcada
        }
        
        console.log(`Migração ${migrationName} marcada como aplicada`);
      } else {
        console.log(`Migração já aplicada: ${migrationName}`);
      }
    }
    
    console.log('=== TODAS AS MIGRAÇÕES FORAM APLICADAS ===');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
};