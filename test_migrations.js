const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados
const dbPath = path.resolve(__dirname, 'server/database/database.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath);

console.log('=== Testando migrações ===');

// Verificar estrutura da tabela transactions
db.serialize(() => {
  // Verificar se os campos de parcelamento existem
  db.all("PRAGMA table_info(transactions)", (err, rows) => {
    if (err) {
      console.error('Erro ao obter informações da tabela transactions:', err);
    } else {
      console.log('\n=== Estrutura da tabela transactions ===');
      rows.forEach(row => {
        console.log(`${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
      });
      
      // Verificar especificamente os campos de parcelamento
      const installmentFields = rows.filter(row => 
        row.name === 'is_installment' || 
        row.name === 'installment_number' || 
        row.name === 'total_installments'
      );
      
      console.log('\n=== Campos de parcelamento ===');
      if (installmentFields.length === 3) {
        console.log('✅ Todos os campos de parcelamento estão presentes:');
        installmentFields.forEach(field => {
          console.log(`  - ${field.name} (${field.type})`);
        });
      } else {
        console.log('❌ Alguns campos de parcelamento estão faltando');
        console.log('Campos encontrados:', installmentFields.map(f => f.name));
      }
      
      // Verificar especificamente os campos de recorrência
      const recurringFields = rows.filter(row => 
        row.name === 'is_recurring' || 
        row.name === 'recurrence_type' || 
        row.name === 'recurrence_count' || 
        row.name === 'recurrence_end_date'
      );
      
      console.log('\n=== Campos de recorrência ===');
      if (recurringFields.length === 4) {
        console.log('✅ Todos os campos de recorrência estão presentes:');
        recurringFields.forEach(field => {
          console.log(`  - ${field.name} (${field.type})`);
        });
      } else {
        console.log('❌ Alguns campos de recorrência estão faltando');
        console.log('Campos encontrados:', recurringFields.map(f => f.name));
      }
    }
  });
  
  // Verificar valores distintos nos campos booleanos
  setTimeout(() => {
    console.log('\n=== Valores nos campos booleanos ===');
    
    db.all("SELECT DISTINCT is_installment FROM transactions", (err, rows) => {
      if (err) {
        console.error('Erro ao obter valores de is_installment:', err);
      } else {
        console.log('Valores em is_installment:');
        rows.forEach(row => {
          console.log(`  - ${row.is_installment} (${typeof row.is_installment})`);
        });
      }
    });
    
    db.all("SELECT DISTINCT is_recurring FROM transactions", (err, rows) => {
      if (err) {
        console.error('Erro ao obter valores de is_recurring:', err);
      } else {
        console.log('Valores em is_recurring:');
        rows.forEach(row => {
          console.log(`  - ${row.is_recurring} (${typeof row.is_recurring})`);
        });
      }
    });
  }, 1000);
  
  // Fechar conexão após um tempo
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar conexão:', err);
      } else {
        console.log('\n✅ Teste de migrações concluído');
      }
    });
  }, 2000);
});