const { Pool } = require('pg');

// Configuração para conexão com PostgreSQL em produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Tentando conectar ao banco de dados PostgreSQL...');
    
    // Testar conexão
    const client = await pool.connect();
    console.log('Conexão bem-sucedida!');
    
    // Verificar status de pagamento
    console.log('\n--- Status de Pagamento ---');
    const paymentStatusResult = await client.query('SELECT * FROM payment_status ORDER BY id');
    console.log('Status de pagamento encontrados:');
    paymentStatusResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Nome: ${row.name}`);
    });
    
    // Verificar algumas transações
    console.log('\n--- Amostra de Transações ---');
    const transactionsResult = await client.query(`
      SELECT id, description, transaction_date, payment_status_id, amount 
      FROM transactions 
      ORDER BY transaction_date DESC 
      LIMIT 5
    `);
    console.log('Transações recentes:');
    transactionsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Data: ${row.transaction_date}, Status: ${row.payment_status_id}, Valor: ${row.amount}, Descrição: ${row.description}`);
    });
    
    // Verificar transações vencidas
    console.log('\n--- Transações Vencidas ---');
    const overdueTransactionsResult = await client.query(`
      SELECT id, description, transaction_date, payment_status_id, amount 
      FROM transactions 
      WHERE payment_status_id != 2 AND transaction_date < CURRENT_DATE
      ORDER BY transaction_date DESC
      LIMIT 5
    `);
    console.log('Transações vencidas:');
    overdueTransactionsResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Data: ${row.transaction_date}, Status: ${row.payment_status_id}, Valor: ${row.amount}, Descrição: ${row.description}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  } finally {
    await pool.end();
  }
}

testConnection();