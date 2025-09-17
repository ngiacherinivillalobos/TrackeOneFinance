const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Tentando conectar ao banco de produção...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕒 Hora do servidor:', result.rows[0].current_time);
    
    // Verificar se usuários existem
    const userCount = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('👥 Total de usuários:', userCount.rows[0].total);
    
    client.release();
    console.log('✅ Teste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();