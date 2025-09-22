// Script para aplicar correções no ambiente de produção
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração de conexão com PostgreSQL (usar as mesmas variáveis do ambiente de produção)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

console.log('=== APLICANDO CORREÇÕES NO POSTGRESQL ===');
console.log('DATABASE_URL:', DATABASE_URL);

// Criar pool de conexão
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Função para aplicar a migração de correção da tabela cards
const applyCardsFix = async () => {
  try {
    console.log('\n1. Aplicando correção da tabela cards...');
    const client = await pool.connect();
    
    // Ler o conteúdo da migração
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'fix_cards_table_postgres.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Conteúdo da migração:');
    console.log(migrationContent);
    
    // Dividir em comandos separados
    const commands = migrationContent.split(';').filter(cmd => cmd.trim() !== '');
    
    for (const command of commands) {
      const cmd = command.trim();
      if (cmd !== '') {
        try {
          console.log(`Executando comando: ${cmd.substring(0, 100)}...`);
          await client.query(cmd);
          console.log('✅ Comando executado com sucesso');
        } catch (error) {
          // Ignorar erros de "já existe" mas logar outros erros
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate key') &&
              !error.message.includes('does not exist') &&
              !error.message.includes('column.*does not exist')) {
            console.error(`❌ Erro ao executar comando:`, error.message);
            throw error;
          } else {
            console.log(`ℹ️  Comando ignorado (já existe ou não é aplicável):`, error.message);
          }
        }
      }
    }
    
    client.release();
    console.log('✅ Correção da tabela cards aplicada com sucesso');
  } catch (error) {
    console.log('❌ Erro ao aplicar correção da tabela cards:', error.message);
    throw error;
  }
};

// Função para verificar a estrutura final
const verifyStructure = async () => {
  try {
    console.log('\n2. Verificando estrutura final...');
    const client = await pool.connect();
    
    // Verificar colunas da tabela cards
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela cards:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar alguns dados
    const countResult = await client.query('SELECT COUNT(*) as count FROM cards');
    console.log(`\nTotal de cartões: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      const sampleResult = await client.query('SELECT * FROM cards LIMIT 1');
      console.log('Exemplo de cartão:', sampleResult.rows[0]);
    }
    
    client.release();
  } catch (error) {
    console.log('❌ Erro ao verificar estrutura:', error.message);
  }
};

// Executar todas as correções
const applyAllFixes = async () => {
  try {
    await applyCardsFix();
    await verifyStructure();
    
    console.log('\n=== TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO ===');
  } catch (error) {
    console.error('\n=== FALHA AO APLICAR CORREÇÕES ===');
    console.error('Erro:', error.message);
    process.exit(1);
  } finally {
    // Fechar pool de conexão
    await pool.end();
  }
};

// Executar correções
applyAllFixes();