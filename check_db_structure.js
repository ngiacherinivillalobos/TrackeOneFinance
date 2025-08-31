const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'database', 'track_one_finance.db');

// Função para verificar a estrutura do banco de dados
async function checkDatabaseStructure() {
  console.log('=== Verificação da Estrutura do Banco de Dados ===\n');
  
  // Abrir conexão com o banco de dados
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao abrir o banco de dados:', err.message);
      return;
    }
    console.log('✅ Conexão com o banco de dados estabelecida');
  });
  
  // Verificar tabelas existentes
  const tables = [
    'users', 'categories', 'category_types', 'subcategories', 
    'payment_status', 'bank_accounts', 'cards', 'contacts', 
    'cost_centers', 'transactions', 'payment_details'
  ];
  
  console.log('\n🔍 Verificando tabelas...\n');
  
  tables.forEach((table) => {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';`;
    
    db.get(query, (err, row) => {
      if (err) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, err.message);
      } else if (row) {
        console.log(`✅ Tabela encontrada: ${table}`);
        
        // Verificar estrutura da tabela
        const structureQuery = `PRAGMA table_info(${table});`;
        db.all(structureQuery, (err, columns) => {
          if (err) {
            console.error(`❌ Erro ao obter estrutura da tabela ${table}:`, err.message);
          } else {
            console.log(`   Colunas: ${columns.length}`);
            columns.forEach(col => {
              console.log(`   - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PK' : ''}`);
            });
          }
        });
      } else {
        console.log(`❌ Tabela não encontrada: ${table}`);
      }
    });
  });
  
  // Verificar usuários existentes
  setTimeout(() => {
    console.log('\n👥 Verificando usuários...\n');
    
    const userQuery = `SELECT id, email, created_at FROM users;`;
    db.all(userQuery, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao consultar usuários:', err.message);
      } else {
        console.log(`✅ Usuários encontrados: ${rows.length}`);
        rows.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}, Criado em: ${user.created_at}`);
        });
      }
      
      // Fechar conexão
      db.close((err) => {
        if (err) {
          console.error('❌ Erro ao fechar o banco de dados:', err.message);
        } else {
          console.log('\n✅ Conexão com o banco de dados fechada');
          console.log('\n🎉 Verificação concluída com sucesso!');
        }
      });
    });
  }, 2000);
}

// Executar verificação
checkDatabaseStructure().catch(console.error);