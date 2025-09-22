const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function applyCardDetailsMigration() {
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se os campos de detalhes do cartão existem
    console.log('\n=== Verificando campos de detalhes do cartão ===');
    const cardDetailsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cards' 
      AND column_name IN ('card_number', 'expiry_date', 'brand')
    `);
    
    console.log(`Campos encontrados: ${cardDetailsCheck.rows.map(row => row.column_name).join(', ')}`);
    
    if (cardDetailsCheck.rows.length === 3) {
      console.log('✅ Campos de detalhes do cartão já existem');
    } else {
      console.log('❌ Campos de detalhes do cartão faltando. Aplicando migração...');
      
      // Verificar cada campo individualmente e adicionar se necessário
      const requiredColumns = ['card_number', 'expiry_date', 'brand'];
      
      for (const column of requiredColumns) {
        const columnExists = cardDetailsCheck.rows.find(row => row.column_name === column);
        
        if (!columnExists) {
          console.log(`Adicionando coluna ${column}...`);
          
          let columnDefinition;
          switch (column) {
            case 'card_number':
              columnDefinition = 'VARCHAR(20)';
              break;
            case 'expiry_date':
              columnDefinition = 'VARCHAR(7)';
              break;
            case 'brand':
              columnDefinition = 'VARCHAR(50)';
              break;
            default:
              columnDefinition = 'TEXT';
          }
          
          await client.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS ${column} ${columnDefinition}`);
          console.log(`✅ Coluna ${column} adicionada com sucesso`);
        }
      }
      
      console.log('✅ Migração de campos de detalhes do cartão aplicada com sucesso');
    }

    // Verificar a estrutura final da tabela
    console.log('\n=== Estrutura atual da tabela cards ===');
    const structure = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'cards' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas na tabela cards:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    client.release();
    console.log('\n✅ Migração de detalhes do cartão concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migração de detalhes do cartão:', error);
  } finally {
    await pool.end();
  }
}

// Executar a migração
applyCardDetailsMigration();