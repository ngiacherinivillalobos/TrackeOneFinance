const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.resolve(__dirname, 'database/track_one_finance.db');
const db = new sqlite3.Database(dbPath);

// Verificar a estrutura da tabela savings_goals
db.serialize(() => {
  db.all("PRAGMA table_info(savings_goals)", (err, rows) => {
    if (err) {
      console.error('Erro ao obter informações da tabela savings_goals:', err);
    } else {
      console.log('Estrutura da tabela savings_goals:');
      if (rows.length === 0) {
        console.log('A tabela savings_goals não existe.');
      } else {
        rows.forEach(row => {
          console.log(`- ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });
      }
    }
  });
});

// Fechar a conexão com o banco de dados
db.close();