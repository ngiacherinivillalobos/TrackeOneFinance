const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkCardsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estrutura atual da tabela cards...');
    
    const structure = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura atual da tabela cards:');
    console.table(structure.rows);
    
    // Verificar especificamente se card_type existe
    const cardTypeExists = structure.rows.find(row => row.column_name === 'card_type');
    const typeExists = structure.rows.find(row => row.column_name === 'type');
    
    console.log('✅ Coluna card_type existe:', !!cardTypeExists);
    console.log('✅ Coluna type existe:', !!typeExists);
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCardsStructure();