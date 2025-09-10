const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Testar aplicação de migrações no PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Testando aplicação de migrações no PostgreSQL...');

const applyMigration = async (migrationPath) => {
  try {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Aplicando migração: ${path.basename(migrationPath)}`);
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSql.split(';').filter(cmd => cmd.trim() !== '');
    
    for (const command of commands) {
      const cmd = command.trim();
      if (cmd !== '') {
        console.log(`Executando comando: ${cmd.substring(0, 100)}...`);
        await pool.query(cmd);
      }
    }
    
    console.log(`Migração ${path.basename(migrationPath)} aplicada com sucesso`);
  } catch (error) {
    console.error(`Erro ao aplicar migração ${path.basename(migrationPath)}:`, error.message);
    throw error;
  }
};

const testMigrations = async () => {
  try {
    // Testar conexão
    const result = await pool.query('SELECT NOW()');
    console.log('Conexão com PostgreSQL bem-sucedida!');
    
    // Verificar se a tabela transactions existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Tabela transactions existe:', tableExists);
    
    if (tableExists) {
      // Verificar se a coluna payment_date existe
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'payment_date'
      `);
      
      const columnExists = columnCheck.rows.length > 0;
      console.log('Coluna payment_date existe:', columnExists);
      
      if (!columnExists) {
        // Aplicar a migração
        const migrationPath = path.resolve(__dirname, 'database', 'migrations', 'add_payment_date_to_transactions_postgres.sql');
        if (fs.existsSync(migrationPath)) {
          await applyMigration(migrationPath);
        } else {
          console.log('Arquivo de migração não encontrado');
        }
      }
    }
    
    // Fechar a conexão
    await pool.end();
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro no teste:', error);
    await pool.end();
  }
};

testMigrations();