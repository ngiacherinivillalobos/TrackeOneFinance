const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixCardNumberLength() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigindo comprimento do campo card_number...');
    
    // Alterar o campo card_number para aceitar até 20 caracteres
    await client.query(`
      ALTER TABLE cards 
      ALTER COLUMN card_number TYPE VARCHAR(20);
    `);
    
    console.log('✅ Campo card_number alterado para VARCHAR(20) com sucesso!');
    
    // Verificar a estrutura atual
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'cards' AND column_name = 'card_number';
    `);
    
    console.log('📋 Estrutura atual do campo card_number:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir campo card_number:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCardNumberLength();