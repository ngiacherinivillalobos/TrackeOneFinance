#!/usr/bin/env node

// Script simplificado para aplicar migrações essenciais no banco de dados PostgreSQL em produção
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do cliente PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function applySimpleMigrations() {
  try {
    console.log('=== Aplicando migrações essenciais ===');
    
    // Conectar ao banco de dados
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Adicionar campos na tabela cards
    console.log('\n🔍 Adicionando campos na tabela cards...');
    await client.query(`
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_number VARCHAR(20);
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(7);
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
    `);
    console.log('✅ Campos adicionados com sucesso na tabela cards');
    
    // Remover tabela credit_card_transactions existente (se houver)
    console.log('\n🔍 Removendo tabela credit_card_transactions existente...');
    await client.query('DROP TABLE IF EXISTS credit_card_transactions CASCADE');
    console.log('✅ Tabela credit_card_transactions removida com sucesso');
    
    // Criar tabela credit_card_transactions com a estrutura correta
    console.log('\n🔍 Criando tabela credit_card_transactions com estrutura correta...');
    await client.query(`
      CREATE TABLE credit_card_transactions (
          id SERIAL PRIMARY KEY,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
          category_id INTEGER,
          subcategory_id INTEGER,
          card_id INTEGER NOT NULL,
          transaction_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          -- Campos de parcelamento
          is_installment BOOLEAN DEFAULT FALSE,
          installment_number INTEGER,
          total_installments INTEGER,
          
          -- Campos de pagamento
          is_paid BOOLEAN DEFAULT FALSE,
          payment_date DATE,
          paid_amount DECIMAL(10,2),
          payment_type VARCHAR(50),
          payment_observations TEXT,
          discount DECIMAL(10,2) DEFAULT 0,
          interest DECIMAL(10,2) DEFAULT 0,
          
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
          FOREIGN KEY (card_id) REFERENCES cards(id)
      )
    `);
    console.log('✅ Tabela credit_card_transactions criada com sucesso');
    
    // Verificar estrutura final da tabela cards
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
    
    // Verificar estrutura final da tabela credit_card_transactions
    console.log('\n=== Estrutura final da tabela credit_card_transactions ===');
    const ccColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'credit_card_transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas na tabela credit_card_transactions:');
    ccColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    await client.end();
    console.log('\n🎉 Todas as migrações essenciais foram aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    await client.end();
    process.exit(1);
  }
}

applySimpleMigrations();