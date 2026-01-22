const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../database/track_one_finance.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  // Verificar esquema atual
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('Erro ao verificar schema:', err);
      return;
    }

    console.log('Colunas atuais da tabela users:');
    rows.forEach(row => console.log(`  - ${row.name} (${row.type})`));

    const hasColumn = (colName) => rows.some(row => row.name === colName);
    
    if (hasColumn('two_factor_enabled') && hasColumn('two_factor_secret')) {
      console.log('\n✅ Colunas de 2FA já existem!');
      db.close();
      return;
    }

    console.log('\n❌ Colunas faltando. Adicionando...\n');

    const statements = [];

    if (!hasColumn('two_factor_enabled')) {
      statements.push(`ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0`);
    }

    if (!hasColumn('two_factor_secret')) {
      statements.push(`ALTER TABLE users ADD COLUMN two_factor_secret TEXT`);
    }

    let completed = 0;
    statements.forEach((sql) => {
      db.run(sql, (err) => {
        completed++;
        if (err) {
          console.error(`❌ Erro ao executar: ${sql}`);
          console.error(err);
        } else {
          console.log(`✅ Executado: ${sql}`);
        }
        
        if (completed === statements.length) {
          console.log('\n✅ Migration concluída!');
          db.close();
        }
      });
    });
  });
});
