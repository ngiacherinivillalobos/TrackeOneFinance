#!/usr/bin/env node

// Script para verificar a estrutura da tabela de cartões no Render
const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados com SSL desabilitado para Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkCardsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela de cartões no Render...');
    
    // Verificar se a tabela cards existe
    const cardsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cards'
      )
    `);
    
    const cardsExists = cardsResult.rows[0].exists;
    console.log('Tabela cards existe:', cardsExists);
    
    if (cardsExists) {
      // Verificar colunas da tabela cards
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'cards'
        ORDER BY ordinal_position
      `);
      
      console.log('\nColunas da tabela cards:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
      
      // Verificar se os campos necessários existem
      const requiredColumns = ['card_number', 'expiry_date', 'brand'];
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      console.log('\nVerificando campos necessários:');
      requiredColumns.forEach(column => {
        const exists = existingColumns.includes(column);
        console.log(`  - ${column}: ${exists ? '✅ Presente' : '❌ Ausente'}`);
      });
      
      // Verificar dados da tabela cards
      const cardsData = await pool.query('SELECT COUNT(*) as count FROM cards');
      console.log(`\nTotal de cartões cadastrados: ${cardsData.rows[0].count}`);
      
      if (cardsData.rows[0].count > 0) {
        console.log('\nAmostra de cartões:');
        const sampleData = await pool.query('SELECT id, name, card_number, expiry_date, brand FROM cards LIMIT 3');
        sampleData.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ${row.name} - ${row.brand} ****${row.card_number || '****'} (${row.expiry_date || '****'})`);
        });
      }
    } else {
      console.log('❌ Tabela cards não encontrada!');
    }
    
    // Verificar se a tabela credit_card_transactions existe
    const ccTransactionsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'credit_card_transactions'
      )
    `);
    
    const ccTransactionsExists = ccTransactionsResult.rows[0].exists;
    console.log('\nTabela credit_card_transactions existe:', ccTransactionsExists);
    
    if (ccTransactionsExists) {
      // Verificar colunas da tabela credit_card_transactions
      const ccColumnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'credit_card_transactions'
        ORDER BY ordinal_position
      `);
      
      console.log('\nColunas da tabela credit_card_transactions:');
      ccColumnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
      
      // Verificar dados da tabela credit_card_transactions
      const ccTransactionsData = await pool.query('SELECT COUNT(*) as count FROM credit_card_transactions');
      console.log(`\nTotal de transações de cartão cadastradas: ${ccTransactionsData.rows[0].count}`);
    } else {
      console.log('❌ Tabela credit_card_transactions não encontrada!');
    }
    
    console.log('\n✅ Verificação concluída com sucesso!');
    await pool.end();
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela de cartões:', error);
    await pool.end();
    process.exit(1);
  }
}

checkCardsStructure();