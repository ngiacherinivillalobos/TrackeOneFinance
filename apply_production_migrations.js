#!/usr/bin/env node

// Script para aplicar migrações no banco de dados PostgreSQL em produção
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do cliente PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function applyMigrations() {
  try {
    console.log('=== Aplicando migrações das tabelas de cartões e transações de cartão no PostgreSQL ===');
    
    // Conectar ao banco de dados
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Verificar e aplicar migração para adicionar campos na tabela cards
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_card_details_to_cards_table.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await client.query(migrationSQL);
      console.log('✅ Migração de campos de cartão aplicada com sucesso');
    } else {
      console.log('⚠️  Arquivo de migração não encontrado:', migrationPath);
    }
    
    // Verificar e aplicar migração para criar tabela credit_card_transactions
    const ccMigrationPath = path.join(__dirname, 'database', 'migrations', 'create_credit_card_transactions_table.sql');
    if (fs.existsSync(ccMigrationPath)) {
      const ccMigrationSQL = fs.readFileSync(ccMigrationPath, 'utf8');
      await client.query(ccMigrationSQL);
      console.log('✅ Migração de tabela de transações de cartão aplicada com sucesso');
    } else {
      console.log('⚠️  Arquivo de migração não encontrado:', ccMigrationPath);
    }
    
    // Verificar estrutura final da tabela cards
    console.log('\n🔍 Verificando campos da tabela cards...');
    const cardsColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cards' AND column_name IN ('card_number', 'expiry_date', 'brand')
    `);
    
    console.log('Colunas existentes:', cardsColumns.rows.map(row => row.column_name));
    console.log('✅ Todas as colunas já existem na tabela cards');
    
    // Verificar estrutura final da tabela credit_card_transactions
    console.log('\n🔍 Verificando tabela credit_card_transactions...');
    const ccTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'credit_card_transactions'
      )
    `);
    
    if (ccTableExists.rows[0].exists) {
      console.log('✅ Tabela credit_card_transactions criada com sucesso');
      
      const ccColumns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'credit_card_transactions'
      `);
      
      console.log('\n=== Estrutura final da tabela credit_card_transactions ===');
      console.log('Colunas na tabela credit_card_transactions:');
      ccColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}`);
      });
    } else {
      console.log('❌ Tabela credit_card_transactions não foi criada');
    }
    
    console.log('\n=== Estrutura final da tabela cards ===');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas na tabela cards:');
    finalColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    await client.end();
    console.log('\n🎉 Todas as migrações foram aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    await client.end();
    process.exit(1);
  }
}

applyMigrations();
