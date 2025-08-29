const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.resolve(__dirname, 'database/track_one_finance.db');
const db = new sqlite3.Database(dbPath);

// Verificar a estrutura da tabela transactions
db.serialize(() => {
  db.all("PRAGMA table_info(transactions)", (err, rows) => {
    if (err) {
      console.error('Erro ao obter informações da tabela transactions:', err);
    } else {
      console.log('Estrutura da tabela transactions:');
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
  });
  
  // Verificar a estrutura da tabela cash_flow
  db.all("PRAGMA table_info(cash_flow)", (err, rows) => {
    if (err) {
      console.error('Erro ao obter informações da tabela cash_flow:', err);
    } else {
      console.log('\nEstrutura da tabela cash_flow:');
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
  });
  
  // Verificar a estrutura da tabela users
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('Erro ao obter informações da tabela users:', err);
    } else {
      console.log('\nEstrutura da tabela users:');
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
  });
});

// Fechar a conexão com o banco de dados
db.close();