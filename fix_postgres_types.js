const { Pool } = require('pg');

// Script para diagnosticar e corrigir problemas de tipos no PostgreSQL
const pool = new Pool({
  connectionString: "postgresql://trackone_user:jFaP2T3NXFVR5Vd6XECePPxkH1VaX5Rz@dpg-cs1q4cbv2p9s73b7nm9g-a.oregon-postgres.render.com/trackone_finance",
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAndFixDataTypes() {
  let client;
  try {
    console.log('🔍 Verificando tipos de dados no PostgreSQL...\n');
    
    client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // 1. Verificar estrutura das tabelas críticas
    console.log('\n=== VERIFICANDO ESTRUTURA DAS TABELAS ===');
    
    const criticalTables = ['categories', 'subcategories', 'transactions', 'payment_status', 'cost_centers'];
    
    for (const tableName of criticalTables) {
      console.log(`\n📋 Tabela: ${tableName}`);
      
      const columns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log('   Colunas:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Verificar dados de exemplo
      try {
        const sample = await client.query(`SELECT * FROM ${tableName} LIMIT 2`);
        if (sample.rows.length > 0) {
          console.log('   Exemplo de dados:');
          sample.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. ${JSON.stringify(row).slice(0, 100)}...`);
          });
        }
      } catch (error) {
        console.log(`   ⚠️ Erro ao buscar dados de exemplo: ${error.message}`);
      }
    }
    
    // 2. Verificar problemas específicos de tipos
    console.log('\n=== VERIFICANDO PROBLEMAS DE TIPOS ===');
    
    // Verificar se payment_status_id é text ou integer
    const paymentStatusType = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'payment_status_id'
    `);
    
    if (paymentStatusType.rows.length > 0) {
      const dataType = paymentStatusType.rows[0].data_type;
      console.log(`\n💡 transactions.payment_status_id: ${dataType}`);
      
      if (dataType === 'text' || dataType === 'character varying') {
        console.log('⚠️ payment_status_id é TEXT - pode causar problemas em queries CASE');
        
        // Verificar valores atuais
        const values = await client.query('SELECT DISTINCT payment_status_id FROM transactions WHERE payment_status_id IS NOT NULL LIMIT 10');
        console.log('   Valores atuais:', values.rows.map(r => r.payment_status_id));
        
        // Tentar converter para integer
        try {
          console.log('\n🔧 Tentando converter payment_status_id para INTEGER...');
          
          await client.query('BEGIN');
          
          // Atualizar valores não numéricos para números
          await client.query(`
            UPDATE transactions 
            SET payment_status_id = '1' 
            WHERE payment_status_id IN ('Em aberto', 'em aberto', 'pendente', 'Pendente')
          `);
          
          await client.query(`
            UPDATE transactions 
            SET payment_status_id = '2' 
            WHERE payment_status_id IN ('Pago', 'pago', 'paid')
          `);
          
          await client.query(`
            UPDATE transactions 
            SET payment_status_id = '3' 
            WHERE payment_status_id IN ('Vencido', 'vencido', 'overdue')
          `);
          
          // Alterar o tipo da coluna
          await client.query(`
            ALTER TABLE transactions 
            ALTER COLUMN payment_status_id TYPE INTEGER USING payment_status_id::INTEGER
          `);
          
          await client.query('COMMIT');
          console.log('✅ payment_status_id convertido para INTEGER');
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.log(`❌ Falha na conversão: ${error.message}`);
        }
      } else {
        console.log('✅ payment_status_id já é numérico');
      }
    }
    
    // 3. Verificar category_id, subcategory_id, etc
    const idColumns = [
      {table: 'transactions', column: 'category_id'},
      {table: 'transactions', column: 'subcategory_id'},
      {table: 'transactions', column: 'cost_center_id'},
      {table: 'subcategories', column: 'category_id'}
    ];
    
    for (const {table, column} of idColumns) {
      const columnType = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      
      if (columnType.rows.length > 0) {
        const dataType = columnType.rows[0].data_type;
        console.log(`\n💡 ${table}.${column}: ${dataType}`);
        
        if (dataType === 'text' || dataType === 'character varying') {
          console.log(`⚠️ ${column} é TEXT - deveria ser INTEGER`);
          
          // Verificar se todos os valores são numéricos
          const nonNumeric = await client.query(`
            SELECT DISTINCT ${column} 
            FROM ${table} 
            WHERE ${column} IS NOT NULL 
            AND ${column} !~ '^[0-9]+$'
            LIMIT 5
          `);
          
          if (nonNumeric.rows.length === 0) {
            try {
              console.log(`🔧 Convertendo ${table}.${column} para INTEGER...`);
              await client.query(`
                ALTER TABLE ${table} 
                ALTER COLUMN ${column} TYPE INTEGER USING ${column}::INTEGER
              `);
              console.log(`✅ ${table}.${column} convertido para INTEGER`);
            } catch (error) {
              console.log(`❌ Falha na conversão de ${table}.${column}: ${error.message}`);
            }
          } else {
            console.log(`❌ ${table}.${column} tem valores não numéricos:`, nonNumeric.rows);
          }
        } else {
          console.log(`✅ ${table}.${column} já é numérico`);
        }
      }
    }
    
    console.log('\n🎉 Verificação de tipos de dados concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError.message);
      }
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar verificação
checkAndFixDataTypes();