// Script para testar a conexão com o PostgreSQL do Render
const { Pool } = require('pg');

console.log('=== TESTE DE CONEXÃO COM O POSTGRESQL DO RENDER ===\n');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.log('❌ Variável DATABASE_URL não está configurada');
  console.log('💡 Configure a variável DATABASE_URL com a URL do seu banco de dados PostgreSQL no Render');
  process.exit(1);
}

console.log('1. Tentando conectar ao banco de dados...');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADA' : 'NÃO CONFIGURADA');

// Criar pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão
pool.query('SELECT NOW()', [])
  .then((result) => {
    console.log('✅ Conexão bem-sucedida!');
    console.log('   Data e hora no banco:', result.rows[0].now);
    
    // Testar se as tabelas existem
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
  })
  .then((result) => {
    console.log('\n2. Tabelas encontradas no banco de dados:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verificar se a tabela transactions existe
    const transactionsTable = result.rows.find(row => row.table_name === 'transactions');
    if (transactionsTable) {
      console.log('\n✅ Tabela transactions encontrada');
      
      // Verificar a estrutura da tabela transactions
      return pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        ORDER BY ordinal_position
      `);
    } else {
      console.log('\n❌ Tabela transactions não encontrada');
      return null;
    }
  })
  .then((result) => {
    if (result) {
      console.log('\n3. Estrutura da tabela transactions:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Verificar se a coluna payment_date existe
      const paymentDateColumn = result.rows.find(row => row.column_name === 'payment_date');
      if (paymentDateColumn) {
        console.log('\n✅ Coluna payment_date encontrada');
      } else {
        console.log('\n❌ Coluna payment_date não encontrada');
      }
    }
    
    // Fechar a conexão
    return pool.end();
  })
  .then(() => {
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n=== FIM DO TESTE ===');
  })
  .catch((error) => {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('   Código do erro:', error.code);
    
    // Fechar a conexão mesmo em caso de erro
    pool.end()
      .then(() => {
        console.log('\n=== FIM DO TESTE (COM ERRO) ===');
      });
  });