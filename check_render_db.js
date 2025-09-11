#!/usr/bin/env node

// Script para verificar a estrutura do banco de dados no Render
const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados no Render...');
    
    // Verificar se a tabela transactions existe
    const transactionsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      )
    `);
    
    const transactionsExists = transactionsResult.rows[0].exists;
    console.log('Tabela transactions existe:', transactionsExists);
    
    if (transactionsExists) {
      // Verificar colunas da tabela transactions
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'transactions'
        ORDER BY ordinal_position
      `);
      
      console.log('\nColunas da tabela transactions:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
      
      // Verificar se a coluna payment_status_id existe
      const hasPaymentStatusId = columnsResult.rows.some(row => row.column_name === 'payment_status_id');
      console.log('\nColuna payment_status_id existe:', hasPaymentStatusId);
      
      // Verificar se a coluna transaction_type existe
      const hasTransactionType = columnsResult.rows.some(row => row.column_name === 'transaction_type');
      console.log('Coluna transaction_type existe:', hasTransactionType);
      
      if (hasTransactionType) {
        // Verificar os valores permitidos para transaction_type
        const constraintResult = await pool.query(`
          SELECT pg_get_constraintdef(pg_constraint.oid) as constraint_def
          FROM pg_constraint
          INNER JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
          INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
          WHERE pg_class.relname = 'transactions'
          AND pg_constraint.contype = 'c'
          AND pg_get_constraintdef(pg_constraint.oid) LIKE '%transaction_type%'
        `);
        
        if (constraintResult.rows.length > 0) {
          console.log('Constraint de transaction_type:', constraintResult.rows[0].constraint_def);
        }
      }
    }
    
    // Verificar se a tabela payment_status existe
    const paymentStatusResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_status'
      )
    `);
    
    const paymentStatusExists = paymentStatusResult.rows[0].exists;
    console.log('\nTabela payment_status existe:', paymentStatusExists);
    
    if (paymentStatusExists) {
      // Verificar dados da tabela payment_status
      const paymentStatusData = await pool.query('SELECT id, name FROM payment_status ORDER BY id');
      console.log('Dados da tabela payment_status:');
      paymentStatusData.rows.forEach(row => {
        console.log(`  - ${row.id}: ${row.name}`);
      });
    }
    
    console.log('\n✅ Verificação concluída com sucesso!');
    await pool.end();
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura do banco de dados:', error);
    await pool.end();
    process.exit(1);
  }
}

checkDatabaseStructure();