const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyPostgreSQLMigrations() {
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se os campos de parcelamento existem
    console.log('\n=== Verificando campos de parcelamento ===');
    const installmentCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('is_installment', 'installment_number', 'total_installments')
    `);
    
    if (installmentCheck.rows.length === 3) {
      console.log('✅ Campos de parcelamento já existem');
    } else {
      console.log('❌ Campos de parcelamento faltando. Aplicando migração...');
      
      // Aplicar migração de campos de parcelamento
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT NULL
      `);
      
      console.log('✅ Migração de campos de parcelamento aplicada com sucesso');
    }

    // Verificar se os campos de recorrência existem
    console.log('\n=== Verificando campos de recorrência ===');
    const recurringCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('is_recurring', 'recurrence_type', 'recurrence_count', 'recurrence_end_date')
    `);
    
    if (recurringCheck.rows.length === 4) {
      console.log('✅ Campos de recorrência já existem');
    } else {
      console.log('❌ Campos de recorrência faltando. Aplicando migração...');
      
      // Aplicar migração de campos de recorrência
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado')),
        ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS recurrence_end_date DATE
      `);
      
      console.log('✅ Migração de campos de recorrência aplicada com sucesso');
    }

    // Aplicar ajustes nos valores booleanos
    console.log('\n=== Ajustando valores booleanos ===');
    
    // Atualizar valores existentes nos campos booleanos para garantir consistência
    await client.query(`
      UPDATE transactions 
      SET is_installment = false 
      WHERE is_installment IS NULL OR is_installment = ''
    `);
    
    await client.query(`
      UPDATE transactions 
      SET is_installment = true 
      WHERE is_installment = 'true' OR is_installment = '1' OR is_installment = 1
    `);
    
    await client.query(`
      UPDATE transactions 
      SET is_recurring = false 
      WHERE is_recurring IS NULL OR is_recurring = ''
    `);
    
    await client.query(`
      UPDATE transactions 
      SET is_recurring = true 
      WHERE is_recurring = 'true' OR is_recurring = '1' OR is_recurring = 1
    `);
    
    console.log('✅ Ajustes de valores booleanos aplicados com sucesso');

    // Verificar valores distintos nos campos booleanos
    console.log('\n=== Verificando valores nos campos booleanos ===');
    const installmentValues = await client.query('SELECT DISTINCT is_installment FROM transactions');
    console.log('Valores em is_installment:');
    installmentValues.rows.forEach(row => {
      console.log(`  - ${row.is_installment} (${typeof row.is_installment})`);
    });
    
    const recurringValues = await client.query('SELECT DISTINCT is_recurring FROM transactions');
    console.log('Valores em is_recurring:');
    recurringValues.rows.forEach(row => {
      console.log(`  - ${row.is_recurring} (${typeof row.is_recurring})`);
    });

    client.release();
    console.log('\n✅ Todas as migrações do PostgreSQL foram aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações do PostgreSQL:', error);
  } finally {
    await pool.end();
  }
}

// Executar as migrações
applyPostgreSQLMigrations();