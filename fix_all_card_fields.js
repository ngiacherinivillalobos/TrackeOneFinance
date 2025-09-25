const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAllCardFields() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Verificando e corrigindo todos os campos da tabela cards...');
    
    // Verificar estrutura atual
    const currentStructure = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura atual da tabela cards:');
    console.table(currentStructure.rows);
    
    // Alterar todos os campos de texto para tamanhos adequados
    console.log('🔧 Alterando campos para tamanhos adequados...');
    
    await client.query(`
      ALTER TABLE cards 
      ALTER COLUMN name TYPE VARCHAR(100),
      ALTER COLUMN card_number TYPE VARCHAR(20),
      ALTER COLUMN expiry_date TYPE VARCHAR(10),
      ALTER COLUMN brand TYPE VARCHAR(50);
    `);
    
    // Se existir coluna type, também alterar
    try {
      await client.query(`ALTER TABLE cards ALTER COLUMN type TYPE VARCHAR(50);`);
      console.log('✅ Campo type também alterado');
    } catch (e) {
      console.log('ℹ️ Campo type não existe ou já está correto');
    }
    
    console.log('✅ Todos os campos alterados com sucesso!');
    
    // Verificar estrutura final
    const finalStructure = await client.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura final da tabela cards:');
    console.table(finalStructure.rows);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir campos:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllCardFields();