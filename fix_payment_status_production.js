#!/usr/bin/env node
/**
 * Script para corrigir problemas de payment_status em produção
 * Este script verifica e corrige a tabela payment_status e transações relacionadas
 */

require('dotenv').config();
const { Client } = require('pg');

async function fixPaymentStatusProduction() {
  console.log('🚀 INICIANDO CORREÇÃO DE PAYMENT_STATUS EM PRODUÇÃO');
  
  let client;
  try {
    // Conectar ao banco de produção usando a string de conexão do Render
    const DATABASE_URL = 'postgresql://default:RBOPfQjxmVqN@ep-weathered-cake-a4z3c1wz-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require';
    
    client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('✅ Conectado ao banco de produção');
    
    // 1. Verificar tabela payment_status atual
    console.log('\n=== VERIFICANDO TABELA PAYMENT_STATUS ===');
    const paymentStatusResult = await client.query('SELECT * FROM payment_status ORDER BY id');
    console.log('Status de pagamento atuais:', paymentStatusResult.rows);
    
    // 2. Garantir que os status básicos existem
    const requiredStatuses = [
      { id: 1, name: 'Em aberto' },
      { id: 2, name: 'Pago' }
    ];
    
    for (const status of requiredStatuses) {
      const existingStatus = paymentStatusResult.rows.find(row => row.id === status.id);
      
      if (!existingStatus) {
        console.log(`\n📝 Inserindo status faltante: ${status.name} (ID: ${status.id})`);
        await client.query(
          'INSERT INTO payment_status (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2',
          [status.id, status.name]
        );
      } else {
        console.log(`✅ Status ${status.name} (ID: ${status.id}) já existe`);
      }
    }
    
    // 3. Verificar transações com payment_status_id inválidos
    console.log('\n=== VERIFICANDO TRANSAÇÕES COM PAYMENT_STATUS_ID INVÁLIDOS ===');
    const invalidTransactionsResult = await client.query(`
      SELECT t.id, t.description, t.payment_status_id, t.type, t.transaction_date
      FROM transactions t
      LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
      WHERE ps.id IS NULL AND t.payment_status_id IS NOT NULL
      ORDER BY t.id DESC
      LIMIT 10
    `);
    
    console.log(`Transações com payment_status_id inválidos: ${invalidTransactionsResult.rows.length}`);
    
    if (invalidTransactionsResult.rows.length > 0) {
      console.log('Transações problemáticas:', invalidTransactionsResult.rows);
      
      // Corrigir transações com payment_status_id inválidos
      console.log('\n📝 CORRIGINDO PAYMENT_STATUS_ID INVÁLIDOS...');
      const updateResult = await client.query(`
        UPDATE transactions 
        SET payment_status_id = 1 
        WHERE payment_status_id NOT IN (
          SELECT id FROM payment_status
        ) OR payment_status_id IS NULL
      `);
      console.log(`✅ ${updateResult.rowCount} transações corrigidas`);
    }
    
    // 4. Verificar transações de receita (income) especificamente
    console.log('\n=== VERIFICANDO TRANSAÇÕES DE RECEITA ===');
    const incomeTransactionsResult = await client.query(`
      SELECT COUNT(*) as total, payment_status_id
      FROM transactions 
      WHERE type = 'income'
      GROUP BY payment_status_id
      ORDER BY payment_status_id
    `);
    
    console.log('Distribuição de transações de receita por status:');
    incomeTransactionsResult.rows.forEach(row => {
      console.log(`  Status ${row.payment_status_id}: ${row.total} transações`);
    });
    
    // 5. Testar inserção de uma transação de receita
    console.log('\n=== TESTE DE INSERÇÃO DE TRANSAÇÃO DE RECEITA ===');
    try {
      const testResult = await client.query(`
        INSERT INTO transactions (
          description, amount, type, category_id, subcategory_id,
          payment_status_id, transaction_date, is_paid
        ) VALUES (
          'TESTE - Receita para validação', 100.00, 'income', 1, 1,
          1, CURRENT_DATE, false
        ) RETURNING id
      `);
      
      const testId = testResult.rows[0].id;
      console.log(`✅ Transação de teste criada com sucesso (ID: ${testId})`);
      
      // Limpar o teste
      await client.query('DELETE FROM transactions WHERE id = $1', [testId]);
      console.log('✅ Transação de teste removida');
      
    } catch (testError) {
      console.error('❌ Erro no teste de inserção:', testError.message);
      
      // Analisar erro específico
      if (testError.message.includes('fk_transactions_payment_status')) {
        console.log('\n🔍 ANALISANDO CONSTRAINT FK_TRANSACTIONS_PAYMENT_STATUS...');
        
        // Verificar constraint
        const constraintResult = await client.query(`
          SELECT 
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM information_schema.table_constraints tc 
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'transactions'
            AND kcu.column_name = 'payment_status_id'
        `);
        
        console.log('Constraint de chave estrangeira:', constraintResult.rows);
        
        // Verificar se categoria e subcategoria existem
        const categoryCheck = await client.query('SELECT id FROM categories WHERE id = 1');
        const subcategoryCheck = await client.query('SELECT id FROM subcategories WHERE id = 1');
        
        console.log('Categoria ID 1 existe:', categoryCheck.rows.length > 0);
        console.log('Subcategoria ID 1 existe:', subcategoryCheck.rows.length > 0);
      }
    }
    
    // 6. Verificar se todas as tabelas referenciadas existem
    console.log('\n=== VERIFICANDO TABELAS REFERENCIADAS ===');
    const tableChecks = [
      'categories',
      'subcategories', 
      'payment_status',
      'contacts',
      'cost_centers',
      'bank_accounts',
      'cards'
    ];
    
    for (const table of tableChecks) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ Tabela ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ Problema com tabela ${table}: ${error.message}`);
      }
    }
    
    console.log('\n✅ CORREÇÃO DE PAYMENT_STATUS CONCLUÍDA');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      await client.end();
      console.log('🔐 Conexão com o banco encerrada');
    }
  }
}

// Executar o script
if (require.main === module) {
  fixPaymentStatusProduction()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { fixPaymentStatusProduction };