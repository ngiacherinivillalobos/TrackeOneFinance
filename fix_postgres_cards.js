// Script para corrigir a estrutura da tabela cards no PostgreSQL
const { Pool } = require('pg');

// Configuração de conexão com PostgreSQL (usar as mesmas variáveis do ambiente de produção)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

console.log('=== CORREÇÃO DA TABELA CARDS NO POSTGRESQL ===');
console.log('DATABASE_URL:', DATABASE_URL);

// Criar pool de conexão
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Função para corrigir a estrutura da tabela cards
const fixCardsTable = async () => {
  try {
    console.log('\n1. Verificando estrutura atual da tabela cards...');
    const client = await pool.connect();
    
    // Verificar colunas existentes
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position
    `);
    
    const columns = columnsResult.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    console.log('Colunas atuais:', columns);
    
    // Verificar e corrigir colunas necessárias
    console.log('\n2. Verificando e corrigindo colunas...');
    
    // Verificar se a coluna 'type' existe (necessária para compatibilidade com SQLite)
    if (!columns['type']) {
      console.log('Adicionando coluna type...');
      await client.query('ALTER TABLE cards ADD COLUMN type VARCHAR(50) DEFAULT \'Crédito\'');
    }
    
    // Verificar se a coluna 'bank_account_id' existe
    if (!columns['bank_account_id']) {
      console.log('Adicionando coluna bank_account_id...');
      await client.query('ALTER TABLE cards ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)');
    }
    
    // Verificar se a coluna 'limit_amount' existe
    if (!columns['limit_amount']) {
      console.log('Adicionando coluna limit_amount...');
      await client.query('ALTER TABLE cards ADD COLUMN limit_amount DECIMAL(10,2) DEFAULT 0');
    }
    
    console.log('✅ Estrutura da tabela cards corrigida com sucesso');
    
    // Verificar dados na tabela
    console.log('\n3. Verificando dados na tabela cards...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM cards');
    console.log(`Total de cartões: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      const sampleResult = await client.query('SELECT * FROM cards LIMIT 1');
      console.log('Exemplo de cartão:', sampleResult.rows[0]);
    }
    
    client.release();
  } catch (error) {
    console.log('❌ Erro ao corrigir tabela cards:', error.message);
    throw error;
  }
};

// Executar correção
const runFix = async () => {
  try {
    await fixCardsTable();
    console.log('\n=== CORREÇÃO CONCLUÍDA COM SUCESSO ===');
  } catch (error) {
    console.error('\n=== FALHA NA CORREÇÃO ===');
    console.error('Erro:', error.message);
    process.exit(1);
  } finally {
    // Fechar pool de conexão
    await pool.end();
  }
};

// Executar correção
runFix();