const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL em produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POSTGRES || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function checkProductionCardsStructure() {
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL em produção');

    // Verificar a estrutura da tabela cards
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'cards' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Estrutura da tabela cards em produção ===');
    console.log('Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Verificar se existem dados na tabela
    const countResult = await client.query('SELECT COUNT(*) as count FROM cards');
    console.log(`\nTotal de registros na tabela cards: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      console.log('\nAmostra de dados:');
      const sampleResult = await client.query('SELECT * FROM cards LIMIT 3');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Registro ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela cards em produção:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductionCardsStructure();