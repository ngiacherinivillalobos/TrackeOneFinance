const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAllFieldConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando TODOS os campos com limitações de tamanho...');
    
    const constraints = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cards' 
        AND data_type LIKE '%character%'
      ORDER BY character_maximum_length, column_name;
    `);
    
    console.log('📋 Campos de texto da tabela cards ordenados por tamanho:');
    console.table(constraints.rows);
    
    // Identificar campos problemáticos
    const problematicFields = constraints.rows.filter(row => 
      row.character_maximum_length && row.character_maximum_length <= 10
    );
    
    if (problematicFields.length > 0) {
      console.log('⚠️ CAMPOS PROBLEMÁTICOS (<=10 caracteres):');
      console.table(problematicFields);
      
      // Corrigir todos os campos problemáticos
      console.log('🔧 Corrigindo campos problemáticos...');
      
      for (const field of problematicFields) {
        let newSize = 50; // Tamanho padrão
        
        // Tamanhos específicos por campo
        if (field.column_name === 'card_number') newSize = 20;
        if (field.column_name === 'expiry_date') newSize = 10;
        if (field.column_name === 'name') newSize = 100;
        
        try {
          await client.query(`ALTER TABLE cards ALTER COLUMN ${field.column_name} TYPE VARCHAR(${newSize});`);
          console.log(`✅ Campo ${field.column_name}: ${field.character_maximum_length} → ${newSize}`);
        } catch (error) {
          console.error(`❌ Erro ao corrigir ${field.column_name}:`, error.message);
        }
      }
      
      // Verificar resultado final
      console.log('\n📋 Estrutura FINAL após correções:');
      const finalStructure = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'cards' 
          AND data_type LIKE '%character%'
        ORDER BY column_name;
      `);
      console.table(finalStructure.rows);
    } else {
      console.log('✅ Nenhum campo problemático encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar campos:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllFieldConstraints();