// Script para verificar os tipos de transações no banco de dados
// Este script deve ser executado no servidor para verificar dados reais

// Ajustar o caminho para o módulo de conexão com o banco de dados
const path = require('path');
const { getDatabase } = require(path.join(__dirname, 'server', 'src', 'database', 'connection'));

async function checkTransactionTypes() {
  try {
    console.log('Verificando tipos de transações no banco de dados...\n');
    
    const { db, all } = getDatabase();
    
    // Verificar valores distintos da coluna type
    console.log('--- Valores distintos da coluna type ---');
    const typeValues = await all(db, `
      SELECT DISTINCT type, typeof(type) as type_type, COUNT(*) as count
      FROM transactions 
      GROUP BY type, typeof(type)
      ORDER BY type
    `);
    
    console.log('Valores encontrados na coluna type:');
    typeValues.forEach(row => {
      console.log(`  "${row.type}" (${row.type_type}) - ${row.count} registros`);
    });
    
    // Verificar se há valores nulos ou inválidos
    console.log('\n--- Valores nulos ou inválidos ---');
    const nullValues = await all(db, `
      SELECT COUNT(*) as null_count
      FROM transactions 
      WHERE type IS NULL
    `);
    
    console.log(`Registros com type NULL: ${nullValues[0].null_count}`);
    
    // Verificar a estrutura da tabela
    console.log('\n--- Estrutura da tabela transactions ---');
    if (process.env.NODE_ENV === 'production') {
      // Para PostgreSQL
      const tableStructure = await all(db, `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'type'
      `);
      
      console.log('Estrutura da coluna type (PostgreSQL):');
      tableStructure.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
      });
    } else {
      // Para SQLite
      const tableStructure = await all(db, `
        PRAGMA table_info(transactions)
      `);
      
      const typeColumn = tableStructure.find(col => col.name === 'type');
      if (typeColumn) {
        console.log('Estrutura da coluna type (SQLite):');
        console.log(`  ${typeColumn.name}: ${typeColumn.type} (${typeColumn.notnull ? 'NOT NULL' : 'NULL'})`);
      }
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tipos de transações:', error);
  }
}

// Executar apenas se este script for executado diretamente
if (require.main === module) {
  checkTransactionTypes().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { checkTransactionTypes };