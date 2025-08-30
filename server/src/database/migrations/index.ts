import fs from 'fs';
import path from 'path';
import { getDatabase } from '../connection';

const runMigrations = async (): Promise<void> => {
  const dbWrapper = getDatabase();
  
  try {
    const schemaPath = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'initial.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      throw new Error('initial.sql not found');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Para PostgreSQL, dividimos o schema em comandos individuais
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Em produção (PostgreSQL), executamos cada comando separadamente
      const commands = schema.split(';').filter(cmd => cmd.trim() !== '');
      
      for (const command of commands) {
        if (command.trim() !== '') {
          await dbWrapper.run(dbWrapper.db, command.trim());
        }
      }
      console.log('Initial schema applied successfully');
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

export { runMigrations };