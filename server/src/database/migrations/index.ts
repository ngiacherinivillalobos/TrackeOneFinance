import fs from 'fs';
import path from 'path';
import { getDatabase } from '../connection';

const runMigrations = async (): Promise<void> => {
  const dbWrapper = getDatabase();
  
  try {
    // Para PostgreSQL, usar um schema específico
    const isProduction = process.env.NODE_ENV === 'production';
    let schemaPath;
    
    if (isProduction) {
      // Verificar se existe um arquivo initial_postgres.sql específico para PostgreSQL
      const postgresSchemaPath = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'initial_postgres.sql');
      if (fs.existsSync(postgresSchemaPath)) {
        schemaPath = postgresSchemaPath;
      } else {
        // Se não existir, usar o arquivo padrão mas adaptar as instruções
        schemaPath = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'initial.sql');
      }
    } else {
      schemaPath = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'initial.sql');
    }
    
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      throw new Error('initial.sql not found');
    }
    
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Para PostgreSQL, adaptar as instruções específicas do SQLite
    if (isProduction) {
      // Substituir INSERT OR IGNORE por INSERT ... ON CONFLICT DO NOTHING
      schema = schema.replace(/INSERT OR IGNORE/g, 'INSERT');
      
      // Dividir o schema em comandos individuais
      const commands = schema.split(';').filter(cmd => cmd.trim() !== '');
      
      for (const command of commands) {
        let cmd = command.trim();
        if (cmd !== '') {
          // Adicionar ON CONFLICT DO NOTHING para comandos INSERT
          if (cmd.toUpperCase().startsWith('INSERT')) {
            cmd = cmd.replace(/INSERT(.+?VALUES\s*\(.+?\))/i, 'INSERT $1 ON CONFLICT DO NOTHING');
          }
          await dbWrapper.run(dbWrapper.db, cmd);
        }
      }
      console.log('Initial schema applied successfully');
      
      // Aplicar migrações específicas do PostgreSQL
      await applyPostgreSQLMigrations(dbWrapper);
    } else {
      // Em desenvolvimento (SQLite), podemos executar tudo de uma vez
      await new Promise<void>((resolve, reject) => {
        (dbWrapper.db as any).exec(schema, (err: any) => {
          if (err) {
            console.error('Error applying initial schema:', err);
            reject(err);
          } else {
            console.log('Initial schema applied successfully');
            resolve();
          }
        });
      });
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Função para aplicar migrações específicas do PostgreSQL
const applyPostgreSQLMigrations = async (dbWrapper: any) => {
  console.log('Aplicando migrações específicas do PostgreSQL...');
  
  // Diretório de migrações
  const migrationsDir = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'migrations');
  
  // Verificar se o diretório de migrações existe
  if (!fs.existsSync(migrationsDir)) {
    console.log('Diretório de migrações não encontrado, pulando migrações adicionais');
    return;
  }
  
  // Listar arquivos de migração específicos do PostgreSQL
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.includes('_postgres.sql'))
    .sort();
  
  console.log(`Encontradas ${migrationFiles.length} migrações específicas do PostgreSQL`);
  
  // Aplicar cada migração
  for (const file of migrationFiles) {
    console.log(`Aplicando migração: ${file}`);
    const migrationPath = path.join(migrationsDir, file);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSql.split(';').filter(cmd => cmd.trim() !== '');
    
    for (const command of commands) {
      const cmd = command.trim();
      if (cmd !== '') {
        try {
          await dbWrapper.run(dbWrapper.db, cmd);
        } catch (error) {
          console.error(`Erro ao executar comando da migração ${file}:`, error);
          throw error;
        }
      }
    }
    
    console.log(`Migração ${file} aplicada com sucesso`);
  }
  
  console.log('Todas as migrações específicas do PostgreSQL foram aplicadas');
};

export { runMigrations };