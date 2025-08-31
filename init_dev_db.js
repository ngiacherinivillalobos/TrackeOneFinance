const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o banco de dados
const dbPath = path.join(__dirname, 'database', 'track_one_finance.db');

// Caminho para o arquivo de schema
const schemaPath = path.join(__dirname, 'database', 'initial.sql');

// Função para inicializar o banco de dados
async function initDatabase() {
  console.log('=== Inicialização do Banco de Dados de Desenvolvimento ===\n');
  
  // Verificar se o arquivo do banco já existe
  if (fs.existsSync(dbPath)) {
    console.log('⚠️  Banco de dados já existe:', dbPath);
    console.log('Se você quiser recriá-lo, delete o arquivo manualmente primeiro.');
    return;
  }
  
  console.log('Criando banco de dados em:', dbPath);
  
  // Criar diretório se não existir
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Diretório do banco de dados criado:', dbDir);
  }
  
  // Abrir conexão com o banco de dados
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados:', err.message);
      return;
    }
    console.log('✅ Conexão com o banco de dados estabelecida');
  });
  
  // Ler o arquivo de schema
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Arquivo de schema não encontrado:', schemaPath);
    db.close();
    return;
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Arquivo de schema carregado');
  
  // Executar o schema
  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Erro ao executar o schema:', err.message);
      db.close();
      return;
    }
    
    console.log('✅ Schema executado com sucesso');
    
    // Inserir dados de teste
    const testUsers = [
      'INSERT OR REPLACE INTO users (email, password) VALUES ("admin@trackone.com", "$2b$10$wqqbrrLfFsQKggP1wYa89.ruh5CkP9DcRLnrxbM7/NnbHg6J2ntu.");'
    ];
    
    let insertCount = 0;
    
    testUsers.forEach((query) => {
      db.run(query, (err) => {
        if (err) {
          console.error('❌ Erro ao inserir dados de teste:', err.message);
        } else {
          console.log('✅ Dados de teste inseridos');
          insertCount++;
        }
        
        // Fechar conexão após todas as inserções
        if (insertCount === testUsers.length) {
          db.close((err) => {
            if (err) {
              console.error('Erro ao fechar o banco de dados:', err.message);
            } else {
              console.log('✅ Conexão com o banco de dados fechada');
              console.log('\n🎉 Banco de dados inicializado com sucesso!');
              console.log('📧 Usuário de teste: admin@trackone.com');
              console.log('🔐 Senha de teste: admin123');
            }
          });
        }
      });
    });
  });
}

// Executar inicialização
initDatabase().catch(console.error);