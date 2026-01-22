const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/dev.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  // Listar todas as tabelas
  db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
    if (err) {
      console.error('Erro ao listar tabelas:', err);
      db.close();
      return;
    }
    
    console.log('Tabelas no banco de dados:');
    if (rows.length === 0) {
      console.log('  (nenhuma tabela encontrada)');
    } else {
      rows.forEach(row => console.log(`  - ${row.name}`));
    }
    db.close();
  });
});
