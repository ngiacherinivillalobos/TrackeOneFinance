import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

async function debugCharacterVarying4() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔍 Conectado ao PostgreSQL. Buscando TODOS os campos VARCHAR(4) no banco...\n');

    // Busca TODOS os campos VARCHAR(4) em TODAS as tabelas
    const allVarchar4Query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE 
        data_type = 'character varying' 
        AND character_maximum_length = 4
      ORDER BY table_name, column_name;
    `;

    const result = await client.query(allVarchar4Query);
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhum campo VARCHAR(4) encontrado no banco!');
    } else {
      console.log('🚨 CAMPOS VARCHAR(4) ENCONTRADOS:');
      console.table(result.rows);

      // Para cada campo encontrado, mostrar alguns valores de exemplo
      for (const row of result.rows) {
        console.log(`\n📋 Valores de exemplo para ${row.table_name}.${row.column_name}:`);
        try {
          const sampleQuery = `SELECT ${row.column_name}, length(${row.column_name}) as tamanho FROM ${row.table_name} WHERE ${row.column_name} IS NOT NULL LIMIT 5`;
          const sampleResult = await client.query(sampleQuery);
          if (sampleResult.rows.length > 0) {
            console.table(sampleResult.rows);
          } else {
            console.log('   (Nenhum valor encontrado)');
          }
        } catch (error) {
          console.log(`   Erro ao consultar valores: ${error.message}`);
        }
      }
    }

    // Verificar especificamente a tabela cards que está dando erro
    console.log('\n🔍 Verificando estrutura ATUAL da tabela cards:');
    const cardsStructureQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'cards'
      ORDER BY ordinal_position;
    `;

    const cardsResult = await client.query(cardsStructureQuery);
    console.table(cardsResult.rows);

    // Tentar fazer o UPDATE que está falhando para ver o erro exato
    console.log('\n🧪 Testando UPDATE que está falhando...');
    const testData = {
      name: 'Carrefour',
      card_number: '5448280000000007',
      expiry_date: '11/2025',
      brand: 'Visa',
      closing_day: 9,
      due_day: 19,
      id: 5
    };

    const updateQuery = `
      UPDATE cards 
      SET name = $1, card_number = $2, expiry_date = $3, brand = $4, closing_day = $5, due_day = $6 
      WHERE id = $7
    `;

    try {
      await client.query(updateQuery, [
        testData.name,
        testData.card_number, 
        testData.expiry_date,
        testData.brand,
        testData.closing_day,
        testData.due_day,
        testData.id
      ]);
      console.log('✅ UPDATE executado com sucesso!');
    } catch (updateError) {
      console.log('🚨 ERRO NO UPDATE:');
      console.log('Code:', updateError.code);
      console.log('Detail:', updateError.detail);
      console.log('Message:', updateError.message);
      console.log('Constraint:', updateError.constraint);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

debugCharacterVarying4().catch(console.error);