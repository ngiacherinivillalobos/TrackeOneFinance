const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Conexão com SQLite - corrigido para o caminho correto
const sqliteDb = new sqlite3.Database('../database/track_one_finance.db');

// Substitua essas informações pelas suas credenciais do PostgreSQL no Render
const pgClient = new Client({
  connectionString: 'postgres://db_trackeonefinance_user:MX7Xn8tctrx7mduv3jqlJRRzyTBjO04l@dpg-d2p440vdiees73bhqqo0-a.oregon-postgres.render.com:5432/db_trackeonefinance',
  ssl: {
    rejectUnauthorized: false
  }
});

// Array com todas as tabelas a serem migradas
const tables = [
  'users',
  'categories',
  'category_types',
  'subcategories',
  'payment_status',  // Corrigido o nome da tabela
  'contacts',
  'cards',
  'bank_accounts',
  'cost_centers',
  'transactions',
  'cash_flow',
  'savings_goals'
  // Adicione outras tabelas se necessário
];

// Função para mapear tipos SQLite para PostgreSQL
function mapSqliteTypeToPostgres(sqliteType) {
  if (!sqliteType) return 'TEXT';

  const type = sqliteType.toUpperCase();
  if (type.includes('INT')) return 'INTEGER';
  if (type.includes('CHAR') || type.includes('TEXT') || type.includes('VARCHAR')) return 'TEXT';
  if (type.includes('REAL') || type.includes('FLOA') || type.includes('DOUB')) return 'NUMERIC';
  if (type.includes('BOOL')) return 'BOOLEAN';
  if (type.includes('DATE') || type.includes('TIME')) return 'TIMESTAMP';
  return 'TEXT';
}

// Função para obter o esquema de uma tabela
function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) return reject(err);
      resolve(columns);
    });
  });
}

// Função para criar tabela no PostgreSQL
async function createTableInPostgres(tableName, columns) {
  const columnDefinitions = columns.map(col => {
    const pgType = mapSqliteTypeToPostgres(col.type);
    const nullable = col.notnull === 1 ? 'NOT NULL' : '';
    const primaryKey = col.pk === 1 ? 'PRIMARY KEY' : '';
    return `"${col.name}" ${pgType} ${nullable} ${primaryKey}`.trim();
  }).join(', ');

  const createTableQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefinitions})`;
  
  try {
    await pgClient.query(createTableQuery);
    console.log(`Tabela ${tableName} criada com sucesso no PostgreSQL`);
  } catch (error) {
    console.error(`Erro ao criar tabela ${tableName}:`, error);
  }
}

// Função para obter dados de uma tabela
function getTableData(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Função para inserir dados no PostgreSQL
async function insertDataToPostgres(tableName, data) {
  if (data.length === 0) {
    console.log(`Nenhum dado para inserir na tabela ${tableName}`);
    return;
  }
  
  // Obtém os nomes das colunas do primeiro registro
  const columns = Object.keys(data[0]);
  
  // Prepara a consulta de inserção para cada linha
  for (const row of data) {
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const values = columns.map(col => row[col]);
    
    const insertQuery = `INSERT INTO "${tableName}" ("${columns.join('", "')}") 
                         VALUES (${placeholders})
                         ON CONFLICT DO NOTHING`;
    
    try {
      await pgClient.query(insertQuery, values);
    } catch (error) {
      console.error(`Erro ao inserir dados na tabela ${tableName}:`, error);
    }
  }
  
  console.log(`Dados inseridos com sucesso na tabela ${tableName}: ${data.length} registros`);
}

// Função principal para migrar esquema e dados
async function migrateToPostgres() {
  try {
    console.log('Iniciando migração para PostgreSQL...');
    
    // Conectar ao PostgreSQL
    await pgClient.connect();
    console.log('Conectado ao PostgreSQL');
    
    // Migrar cada tabela
    for (const tableName of tables) {
      console.log(`\nMigrando tabela: ${tableName}`);
      
      // Obter esquema da tabela
      const columns = await getTableSchema(tableName);
      if (columns.length === 0) {
        console.log(`Tabela ${tableName} não encontrada no SQLite, pulando...`);
        continue;
      }
      
      // Criar tabela no PostgreSQL
      await createTableInPostgres(tableName, columns);
      
      // Obter dados da tabela
      const data = await getTableData(tableName);
      console.log(`Dados obtidos da tabela ${tableName}: ${data.length} registros`);
      
      // Inserir dados no PostgreSQL
      await insertDataToPostgres(tableName, data);
    }
    
    console.log('\nMigração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    // Fechar conexões
    sqliteDb.close();
    await pgClient.end();
  }
}

// Executar a migração
migrateToPostgres();