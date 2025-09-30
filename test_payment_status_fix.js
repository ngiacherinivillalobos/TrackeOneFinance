// Script para verificar e corrigir problema com payment_status_id
const path = require('path');

// Configurar o caminho correto para o módulo
const connectionPath = path.join(__dirname, 'server', 'src', 'database', 'connection.js');

async function checkAndFixPaymentStatus() {
  try {
    console.log('🔍 Verificando estrutura da tabela payment_status...');
    console.log('Ambiente:', process.env.NODE_ENV || 'development');
    
    // Carregar a conexão do banco
    const { getDatabase } = require(connectionPath);
    const { db, all, run } = getDatabase();
    
    // 1. Verificar se a tabela payment_status existe
    const tables = await all(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='payment_status'");
    console.log('Tabelas payment_status encontradas:', tables);
    
    if (tables.length === 0) {
      console.log('❌ Tabela payment_status não encontrada! Criando...');
      
      // Criar tabela payment_status
      await run(db, `
        CREATE TABLE IF NOT EXISTS payment_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir status básicos
      await run(db, "INSERT OR IGNORE INTO payment_status (id, name) VALUES (1, 'Em aberto')");
      await run(db, "INSERT OR IGNORE INTO payment_status (id, name) VALUES (2, 'Pago')");
      await run(db, "INSERT OR IGNORE INTO payment_status (id, name) VALUES (3, 'Vencido')");
      
      console.log('✅ Tabela payment_status criada com sucesso!');
    }
    
    // 2. Listar todos os status disponíveis
    const statuses = await all(db, 'SELECT * FROM payment_status ORDER BY id');
    console.log('Status de pagamento disponíveis:', statuses);
    
    // 3. Verificar constraint da tabela transactions
    const tableInfo = await all(db, "PRAGMA foreign_key_list(transactions)");
    console.log('Foreign keys da tabela transactions:', tableInfo);
    
    // 4. Verificar se existe alguma transação com payment_status_id null
    const nullStatusCount = await all(db, 'SELECT COUNT(*) as count FROM transactions WHERE payment_status_id IS NULL');
    console.log('Transações com payment_status_id NULL:', nullStatusCount);
    
    // 5. Corrigir transações com payment_status_id null
    if (nullStatusCount[0].count > 0) {
      console.log('🔧 Corrigindo transações com payment_status_id NULL...');
      
      // Definir status baseado em is_paid ou data
      await run(db, `
        UPDATE transactions 
        SET payment_status_id = CASE 
          WHEN is_paid = 1 THEN 2 
          WHEN transaction_date < date('now') THEN 3
          ELSE 1 
        END
        WHERE payment_status_id IS NULL
      `);
      
      console.log('✅ Transações corrigidas com sucesso!');
    }
    
    // 6. Verificar novamente após correção
    const finalCount = await all(db, 'SELECT COUNT(*) as count FROM transactions WHERE payment_status_id IS NULL');
    console.log('Transações com payment_status_id NULL após correção:', finalCount);
    
    console.log('✅ Verificação e correção concluídas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar/corrigir payment_status:', error);
    console.error('Stack trace:', error.stack);
  }
}

checkAndFixPaymentStatus();