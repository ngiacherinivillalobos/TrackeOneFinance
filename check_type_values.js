const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.resolve(__dirname, 'database/track_one_finance.db');
const db = new sqlite3.Database(dbPath);

// Verificar os valores distintos na coluna type da tabela transactions
db.serialize(() => {
  db.all("SELECT DISTINCT type FROM transactions", (err, rows) => {
    if (err) {
      console.error('Erro ao obter valores da coluna type:', err);
    } else {
      console.log('Valores distintos na coluna type:');
      rows.forEach(row => {
        console.log(`- '${row.type}'`);
      });
    }
  });
});

// Fechar a conexão com o banco de dados
db.close();