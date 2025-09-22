// Script para diagnosticar problemas com PostgreSQL em produção
const { Pool } = require('pg');

// Configuração de conexão com PostgreSQL (usar as mesmas variáveis do ambiente de produção)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

console.log('=== DIAGNÓSTICO DO POSTGRESQL ===');
console.log('DATABASE_URL:', DATABASE_URL);

// Criar pool de conexão
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Função para diagnosticar a conexão
const diagnoseConnection = async () => {
  try {
    console.log('\n1. Testando conexão com PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso');
    
    // Testar uma query simples
    const result = await client.query('SELECT NOW() as now');
    console.log('✅ Query de teste executada com sucesso:', result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    return false;
  }
  return true;
};

// Função para verificar estrutura das tabelas
const checkTableStructure = async () => {
  try {
    console.log('\n2. Verificando estrutura das tabelas...');
    const client = await pool.connect();
    
    // Verificar tabela cards
    console.log('Verificando tabela cards...');
    const cardsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela cards:');
    cardsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar tabela categories
    console.log('\nVerificando tabela categories...');
    const categoriesResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela categories:');
    categoriesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar tabela subcategories
    console.log('\nVerificando tabela subcategories...');
    const subcategoriesResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'subcategories'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela subcategories:');
    subcategoriesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    client.release();
  } catch (error) {
    console.log('❌ Erro ao verificar estrutura das tabelas:', error.message);
  }
};

// Função para testar operações CRUD
const testCRUDOperations = async () => {
  try {
    console.log('\n3. Testando operações CRUD...');
    const client = await pool.connect();
    
    // Testar leitura de cartões
    console.log('Testando leitura de cartões...');
    const cards = await client.query('SELECT * FROM cards LIMIT 3');
    console.log(`✅ ${cards.rows.length} cartões encontrados`);
    
    // Testar leitura de categorias
    console.log('Testando leitura de categorias...');
    const categories = await client.query('SELECT * FROM categories LIMIT 3');
    console.log(`✅ ${categories.rows.length} categorias encontradas`);
    
    // Testar leitura de subcategorias
    console.log('Testando leitura de subcategorias...');
    const subcategories = await client.query('SELECT * FROM subcategories LIMIT 3');
    console.log(`✅ ${subcategories.rows.length} subcategorias encontradas`);
    
    client.release();
  } catch (error) {
    console.log('❌ Erro ao testar operações CRUD:', error.message);
  }
};

// Função para verificar triggers
const checkTriggers = async () => {
  try {
    console.log('\n4. Verificando triggers...');
    const client = await pool.connect();
    
    const triggersResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE event_object_table IN ('cards', 'categories', 'subcategories')
      ORDER BY event_object_table, trigger_name
    `);
    
    if (triggersResult.rows.length > 0) {
      console.log('Triggers encontrados:');
      triggersResult.rows.forEach(row => {
        console.log(`  - ${row.trigger_name} (${row.event_manipulation}) ON ${row.event_object_table}`);
      });
    } else {
      console.log('Nenhum trigger encontrado nas tabelas principais');
    }
    
    client.release();
  } catch (error) {
    console.log('❌ Erro ao verificar triggers:', error.message);
  }
};

// Executar diagnóstico completo
const runDiagnosis = async () => {
  const isConnected = await diagnoseConnection();
  if (isConnected) {
    await checkTableStructure();
    await testCRUDOperations();
    await checkTriggers();
  }
  
  console.log('\n=== FIM DO DIAGNÓSTICO ===');
  
  // Fechar pool de conexão
  await pool.end();
};

// Executar diagnóstico
runDiagnosis().catch(error => {
  console.error('Erro durante o diagnóstico:', error);
  process.exit(1);
});