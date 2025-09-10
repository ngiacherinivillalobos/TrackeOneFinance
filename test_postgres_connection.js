const { Pool } = require('pg');
require('dotenv').config();

console.log('Testando conexão com PostgreSQL...');
console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está configurada!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', [])
  .then((result) => {
    console.log('Conexão bem-sucedida!');
    console.log('Data e hora do servidor:', result.rows[0].now);
    pool.end();
  })
  .catch((error) => {
    console.error('Erro na conexão:', error.message);
    pool.end();
  });
