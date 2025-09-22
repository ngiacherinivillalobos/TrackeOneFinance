const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

console.log('Aplicando migração de detalhes do cartão no PostgreSQL...');

const applyCardDetailsMigration = async () => {
  try {
    // Testar conexão
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL bem-sucedida!');
    
    // Verificar se a tabela cards existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cards'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Tabela cards existe:', tableExists);
    
    if (tableExists) {
      // Verificar quais colunas já existem
      const columnsCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cards' AND column_name IN ('card_number', 'expiry_date', 'brand')
      `);
      
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      console.log('Colunas existentes:', existingColumns);
      
      // Verificar quais colunas precisam ser adicionadas
      const requiredColumns = ['card_number', 'expiry_date', 'brand'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('Colunas faltando:', missingColumns);
        
        // Adicionar as colunas faltando uma por uma
        for (const column of missingColumns) {
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
          
          const alterQuery = `ALTER TABLE cards ADD COLUMN IF NOT EXISTS ${column} ${columnDefinition}`;
          console.log(`Adicionando coluna ${column}...`);
          await pool.query(alterQuery);
          console.log(`✅ Coluna ${column} adicionada com sucesso`);
        }
        
        console.log('✅ Todas as colunas foram adicionadas com sucesso!');
      } else {
        console.log('✅ Todas as colunas já existem na tabela cards');
      }
      
      // Verificar a estrutura final da tabela
      console.log('\n=== Estrutura atual da tabela cards ===');
      const structure = await pool.query(`
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
    } else {
      console.log('❌ Tabela cards não encontrada');
    }
    
    // Fechar a conexão
    await pool.end();
    console.log('\n🎉 Migração de detalhes do cartão concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    await pool.end();
  }
};

// Executar a migração
applyCardDetailsMigration();