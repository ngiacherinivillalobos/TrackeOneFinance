const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'track_one_finance.db');

// Garantir que o diretório existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco:', err);
    process.exit(1);
  }

  console.log('Iniciando banco SQLite em:', dbPath);

  // Ler e executar o script SQL
  const sqlPath = path.join(__dirname, 'database', 'initial.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  db.exec(sqlContent, (err) => {
    if (err) {
      console.error('Erro ao executar SQL inicial:', err);
      db.close();
      process.exit(1);
    }

    console.log('Schema inicial criado com sucesso');

    // Criar tabela de migrações
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela migrations:', err);
      } else {
        console.log('Tabela migrations criada com sucesso');
      }

      db.close(() => {
        console.log('Banco inicializado com sucesso!');
        process.exit(0);
      });
    });
  });
});
