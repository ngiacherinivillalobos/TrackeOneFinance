// Script para corrigir problema de payment_status_id em produção
// Este script deve ser executado após o deploy para garantir que:
// 1. A tabela payment_status tenha os registros necessários
// 2. Todas as transações tenham payment_status_id válido

console.log('🔧 INICIANDO CORREÇÃO DE PAYMENT_STATUS_ID PARA PRODUÇÃO');
console.log('Este script corrige problemas de chave estrangeira em produção');

// Função principal de correção
async function fixPaymentStatusProduction() {
  try {
    console.log('Ambiente detectado:', process.env.NODE_ENV || 'development');
    
    // Importar módulos necessários
    const { Pool } = require('pg');
    
    // Verificar se estamos em produção
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log('❌ Este script deve ser executado apenas em produção!');
      console.log('Use NODE_ENV=production node fix_payment_status_production.js');
      return;
    }
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL não configurada!');
      return;
    }
    
    console.log('📡 Conectando ao PostgreSQL...');
    
    // Conectar ao banco PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // 1. Verificar se a tabela payment_status existe
    console.log('🔍 Verificando tabela payment_status...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_status'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📝 Criando tabela payment_status...');
      await pool.query(`
        CREATE TABLE payment_status (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // 2. Garantir que os registros básicos existam
    console.log('📝 Inserindo registros básicos de payment_status...');
    
    // Usar ON CONFLICT para evitar erros de duplicação
    await pool.query(`
      INSERT INTO payment_status (id, name) VALUES 
      (1, 'Em aberto'),
      (2, 'Pago'),
      (3, 'Vencido')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name
    `);
    
    // 3. Verificar registros existentes
    const statuses = await pool.query('SELECT * FROM payment_status ORDER BY id');
    console.log('✅ Status de pagamento disponíveis:', statuses.rows);
    
    // 4. Verificar se existe a coluna payment_status_id na tabela transactions
    console.log('🔍 Verificando coluna payment_status_id...');
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_status_id'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('📝 Adicionando coluna payment_status_id...');
      await pool.query(`
        ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1
      `);
    }
    
    // 5. Corrigir transações com payment_status_id NULL ou inválido
    console.log('🔧 Corrigindo transações com payment_status_id inválido...');
    
    // Primeiro, verificar quantas transações têm problema
    const problematicTransactions = await pool.query(`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE payment_status_id IS NULL 
         OR payment_status_id NOT IN (1, 2, 3)
    `);
    
    console.log(`🔍 Encontradas ${problematicTransactions.rows[0].count} transações com payment_status_id inválido`);
    
    if (problematicTransactions.rows[0].count > 0) {
      // Corrigir baseado na data e status de pagamento
      await pool.query(`
        UPDATE transactions 
        SET payment_status_id = CASE 
          WHEN is_paid = true THEN 2  -- Pago
          WHEN transaction_date < CURRENT_DATE THEN 3  -- Vencido
          ELSE 1  -- Em aberto
        END
        WHERE payment_status_id IS NULL 
           OR payment_status_id NOT IN (1, 2, 3)
      `);
      
      console.log('✅ Transações corrigidas com sucesso!');
    }
    
    // 6. Adicionar constraint de foreign key se não existir
    console.log('🔧 Verificando foreign key constraint...');
    
    const constraintExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_transactions_payment_status'
      )
    `);
    
    if (!constraintExists.rows[0].exists) {
      console.log('📝 Adicionando foreign key constraint...');
      await pool.query(`
        ALTER TABLE transactions 
        ADD CONSTRAINT fk_transactions_payment_status 
        FOREIGN KEY (payment_status_id) REFERENCES payment_status(id)
      `);
      
      // Adicionar índice para performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_payment_status 
        ON transactions(payment_status_id)
      `);
    }
    
    // 7. Verificação final
    console.log('🔍 Verificação final...');
    
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE payment_status_id IS NULL 
         OR payment_status_id NOT IN (1, 2, 3)
    `);
    
    console.log(`✅ Transações com payment_status_id inválido após correção: ${finalCheck.rows[0].count}`);
    
    // Fechar conexão
    await pool.end();
    
    console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🚀 O sistema agora deve funcionar corretamente em produção');
    
  } catch (error) {
    console.error('❌ ERRO durante a correção:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Executar a correção
fixPaymentStatusProduction();