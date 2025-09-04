const { Pool } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkPaymentStatus() {
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    
    // Consultar todos os registros da tabela payment_status
    const result = await client.query('SELECT * FROM payment_status ORDER BY id');
    
    console.log('Registros na tabela payment_status:');
    console.log('ID\tNome');
    console.log('--\t----');
    
    result.rows.forEach(row => {
      console.log(`${row.id}\t${row.name}`);
    });
    
    // Verificar se há duplicatas
    const duplicateCheck = await client.query(`
      SELECT name, COUNT(*) as count 
      FROM payment_status 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log('\nRegistros duplicados encontrados:');
      duplicateCheck.rows.forEach(row => {
        console.log(`Nome: ${row.name}, Count: ${row.count}`);
      });
    } else {
      console.log('\nNenhum registro duplicado encontrado.');
    }
    
    client.release();
  } catch (error) {
    console.error('Erro ao verificar registros:', error);
  } finally {
    await pool.end();
  }
}

// Executar a função
checkPaymentStatus();