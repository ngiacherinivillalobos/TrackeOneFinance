// Script para verificar os dados reais no banco de dados PostgreSQL
// Este script deve ser executado no servidor para verificar dados reais

const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
// Substitua pela sua URL de conexão do Render
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://trackone_user:trackone_password@localhost:5432/trackone_finance';

async function checkPostgresData() {
  console.log('Verificando dados no banco de dados PostgreSQL...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // 1. Verificar valores distintos da coluna type na tabela transactions
    console.log('--- Valores distintos da coluna type ---');
    const typeValues = await pool.query(`
      SELECT DISTINCT type, pg_typeof(type) as type_type, COUNT(*) as count
      FROM transactions 
      GROUP BY type, pg_typeof(type)
      ORDER BY type
    `);
    
    console.log('Valores encontrados na coluna type:');
    typeValues.rows.forEach(row => {
      console.log(`  "${row.type}" (${row.type_type}) - ${row.count} registros`);
    });
    
    // 2. Verificar se há valores nulos
    console.log('\n--- Valores nulos ---');
    const nullValues = await pool.query(`
      SELECT COUNT(*) as null_count
      FROM transactions 
      WHERE type IS NULL
    `);
    
    console.log(`Registros com type NULL: ${nullValues.rows[0].null_count}`);
    
    // 3. Verificar registros com problemas de tipo
    console.log('\n--- Registros com problemas de tipo ---');
    const problematicRecords = await pool.query(`
      SELECT id, type, pg_typeof(type) as type_type, amount
      FROM transactions 
      WHERE type IS NOT NULL
      ORDER BY id
      LIMIT 10
    `);
    
    console.log('Amostra de registros:');
    problematicRecords.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Type: "${row.type}" (${row.type_type}), Amount: ${row.amount}`);
    });
    
    // 4. Testar a consulta problemática com mais detalhes
    console.log('\n--- Testando consulta com mais detalhes ---');
    try {
      // Primeiro, vamos pegar um bank_account_id válido
      const bankAccount = await pool.query(`
        SELECT id FROM bank_accounts LIMIT 1
      `);
      
      if (bankAccount.rows.length > 0) {
        const bankAccountId = bankAccount.rows[0].id;
        console.log(`Testando com bank_account_id: ${bankAccountId}`);
        
        // Testar a consulta original problemática
        console.log('\nTestando consulta original:');
        const originalQuery = `
          SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
          FROM transactions 
          WHERE bank_account_id = $1
        `;
        
        try {
          const result = await pool.query(originalQuery, [bankAccountId]);
          console.log('✅ Consulta original executada com sucesso:');
          console.log('  Resultado:', result.rows[0]);
        } catch (error) {
          console.log('❌ Erro na consulta original:', error.message);
        }
        
        // Testar a consulta com conversão explícita
        console.log('\nTestando consulta com conversão explícita:');
        const explicitQuery = `
          SELECT 
            SUM(CASE WHEN type::text = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type::text = 'expense' THEN amount ELSE 0 END) as total_expense
          FROM transactions 
          WHERE bank_account_id = $1
        `;
        
        try {
          const result = await pool.query(explicitQuery, [bankAccountId]);
          console.log('✅ Consulta com conversão explícita executada com sucesso:');
          console.log('  Resultado:', result.rows[0]);
        } catch (error) {
          console.log('❌ Erro na consulta com conversão explícita:', error.message);
        }
        
        // Testar a consulta com tratamento de valores nulos
        console.log('\nTestando consulta com tratamento de valores nulos:');
        const nullSafeQuery = `
          SELECT 
            SUM(CASE WHEN type IS NOT NULL AND type::text = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type IS NOT NULL AND type::text = 'expense' THEN amount ELSE 0 END) as total_expense
          FROM transactions 
          WHERE bank_account_id = $1
        `;
        
        try {
          const result = await pool.query(nullSafeQuery, [bankAccountId]);
          console.log('✅ Consulta com tratamento de valores nulos executada com sucesso:');
          console.log('  Resultado:', result.rows[0]);
        } catch (error) {
          console.log('❌ Erro na consulta com tratamento de valores nulos:', error.message);
        }
      } else {
        console.log('Nenhuma conta bancária encontrada para testar');
      }
    } catch (error) {
      console.log('❌ Erro ao testar consultas:', error.message);
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados do PostgreSQL:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar apenas se este script for executado diretamente
if (require.main === module) {
  checkPostgresData().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { checkPostgresData };