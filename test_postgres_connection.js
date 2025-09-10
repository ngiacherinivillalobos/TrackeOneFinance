const { Pool } = require('pg');

// Testar conexão com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Testando conexão com PostgreSQL...');

pool.query('SELECT NOW()', [])
  .then((result) => {
    console.log('Conexão bem-sucedida!');
    console.log('Data atual no banco:', result.rows[0].now);
    
    // Testar se a tabela transactions existe
    return pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      )
    `);
  })
  .then((result) => {
    const tableExists = result.rows[0].exists;
    console.log('Tabela transactions existe:', tableExists);
    
    if (tableExists) {
      // Verificar a estrutura da tabela
      return pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_date'
      `);
    }
  })
  .then((result) => {
    if (result && result.rows.length > 0) {
      console.log('Coluna payment_date encontrada:', result.rows[0]);
    } else if (result) {
      console.log('Coluna payment_date não encontrada');
    }
    
    // Fechar a conexão
    pool.end();
  })
  .catch((error) => {
    console.error('Erro na conexão:', error);
    pool.end();
  });