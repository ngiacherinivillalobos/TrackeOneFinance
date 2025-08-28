import fs from 'fs';
import path from 'path';
import { getDatabase } from '../connection';

const runMigrations = async (): Promise<void> => {
  const db = getDatabase();
  
  try {
    const schemaPath = path.resolve(__dirname, '..', '..', '..', '..', 'database', 'initial.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      throw new Error('initial.sql not found');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await new Promise<void>((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error applying initial schema:', err);
          reject(err);
        } else {
          console.log('Initial schema applied successfully');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

export { runMigrations };
