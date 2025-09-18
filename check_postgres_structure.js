const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
// Substitua pela sua URL de conexão do Render
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://trackone_user:trackone_password@localhost:5432/trackone_finance';

async function checkPostgresStructure() {
  console.log('Verificando estrutura do banco de dados PostgreSQL...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // 1. Verificar a estrutura da tabela transactions
    console.log('--- Estrutura da tabela transactions ---');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela transactions:');
    tableStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    console.log('\n--- Constraints da tabela transactions ---');
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'transactions' AND constraint_type = 'CHECK'
    `);
    
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.constraint_type}`);
    });
    
    // 2. Verificar os valores distintos da coluna type
    console.log('\n--- Valores distintos da coluna type ---');
    const typeValues = await pool.query(`
      SELECT DISTINCT type FROM transactions ORDER BY type
    `);
    
    console.log('Valores encontrados na coluna type:');
    typeValues.rows.forEach(row => {
      console.log(`  "${row.type}"`);
    });
    
    // 3. Verificar alguns dados de exemplo
    console.log('\n--- Amostra de dados da tabela transactions ---');
    const sampleData = await pool.query(`
      SELECT id, description, amount, type, payment_status_id, is_paid 
      FROM transactions 
      LIMIT 5
    `);
    
    console.log('Amostra de dados:');
    sampleData.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Descrição: ${row.description}, Valor: ${row.amount}, Tipo: "${row.type}", Status: ${row.payment_status_id}, Pago: ${row.is_paid}`);
    });
    
    // 4. Testar a consulta problemática
    console.log('\n--- Testando consulta problemática ---');
    try {
      const testQuery = await pool.query(`
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
        FROM transactions 
        WHERE bank_account_id = 1
      `);
      
      console.log('✅ Consulta executada com sucesso:');
      console.log('  Receitas:', testQuery.rows[0].total_income);
      console.log('  Despesas:', testQuery.rows[0].total_expense);
    } catch (error) {
      console.log('❌ Erro na consulta:', error.message);
    }
    
    console.log('\n✅ Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura do PostgreSQL:', error.message);
  } finally {
    await pool.end();
  }
}

checkPostgresStructure();