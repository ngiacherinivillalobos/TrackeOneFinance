const { Pool } = require('pg');

// Configuração direta do banco PostgreSQL em produção
const pool = new Pool({
  connectionString: "postgresql://trackone_user:jFaP2T3NXFVR5Vd6XECePPxkH1VaX5Rz@dpg-cs1q4cbv2p9s73b7nm9g-a.oregon-postgres.render.com/trackone_finance",
  ssl: {
    rejectUnauthorized: false
  }
});

async function analyzePostgreSQLDatabase() {
  let client;
  try {
    console.log('🔍 Analisando banco PostgreSQL em produção...\n');
    
    client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // 1. Verificar estrutura das tabelas de filtros
    console.log('\n=== ESTRUTURA DAS TABELAS ===');
    
    const tables = ['categories', 'subcategories', 'cost_centers', 'payment_status'];
    
    for (const table of tables) {
      console.log(`\n📋 Tabela: ${table}`);
      
      // Verificar se a tabela existe
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`❌ Tabela ${table} NÃO EXISTE!`);
        continue;
      }
      
      // Verificar estrutura
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log('   Colunas:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Contar registros
      const count = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
      console.log(`   Total de registros: ${count.rows[0].total}`);
      
      // Mostrar alguns registros de exemplo
      if (parseInt(count.rows[0].total) > 0) {
        const sample = await client.query(`SELECT * FROM ${table} LIMIT 3`);
        console.log('   Exemplos de registros:');
        sample.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
        });
      }
    }
    
    // 2. Verificar tabela de usuários
    console.log('\n📋 Tabela: users');
    const usersCount = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`   Total de usuários: ${usersCount.rows[0].total}`);
    
    if (parseInt(usersCount.rows[0].total) > 0) {
      const users = await client.query('SELECT id, name, email, is_admin FROM users LIMIT 3');
      console.log('   Usuários:');
      users.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ID:${user.id} | ${user.name} | ${user.email} | Admin:${user.is_admin}`);
      });
    }
    
    // 3. Verificar relacionamentos
    console.log('\n=== VERIFICANDO RELACIONAMENTOS ===');
    
    // Verificar se subcategorias têm category_id válidos
    const subcatRelation = await client.query(`
      SELECT 
        s.id, s.name, s.category_id,
        c.name as category_name
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE c.id IS NULL
      LIMIT 5
    `);
    
    if (subcatRelation.rows.length > 0) {
      console.log('❌ Subcategorias com category_id inválido:');
      subcatRelation.rows.forEach(row => {
        console.log(`   - ${row.name} (category_id: ${row.category_id})`);
      });
    } else {
      console.log('✅ Todos os relacionamentos subcategoria->categoria estão válidos');
    }
    
    // 4. Verificar transações com dados relacionais
    console.log('\n=== VERIFICANDO TRANSAÇÕES ===');
    const transactionsCount = await client.query('SELECT COUNT(*) as total FROM transactions');
    console.log(`   Total de transações: ${transactionsCount.rows[0].total}`);
    
    if (parseInt(transactionsCount.rows[0].total) > 0) {
      // Verificar transações com categorias
      const transWithCat = await client.query(`
        SELECT COUNT(*) as total 
        FROM transactions t
        INNER JOIN categories c ON t.category_id = c.id
      `);
      console.log(`   Transações com categoria válida: ${transWithCat.rows[0].total}`);
      
      // Verificar transações com centro de custo
      const transWithCC = await client.query(`
        SELECT COUNT(*) as total 
        FROM transactions t
        INNER JOIN cost_centers cc ON t.cost_center_id = cc.id
      `);
      console.log(`   Transações com centro de custo válido: ${transWithCC.rows[0].total}`);
    }
    
    // 5. Testar as mesmas queries que as APIs fazem
    console.log('\n=== TESTANDO QUERIES DAS APIS ===');
    
    // Query de categorias (igual à API)
    const apiCategories = await client.query(`
      SELECT c.*, ct.name as category_type_name
      FROM categories c
      LEFT JOIN category_types ct ON c.category_type_id = ct.id
      ORDER BY c.name
    `);
    console.log(`✅ Query de categorias: ${apiCategories.rows.length} resultados`);
    
    // Query de subcategorias (igual à API)
    const apiSubcategories = await client.query(`
      SELECT s.*, c.name as category_name
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.name
    `);
    console.log(`✅ Query de subcategorias: ${apiSubcategories.rows.length} resultados`);
    
    // Query de centros de custo (igual à API)
    const apiCostCenters = await client.query(`
      SELECT * FROM cost_centers ORDER BY name
    `);
    console.log(`✅ Query de centros de custo: ${apiCostCenters.rows.length} resultados`);
    
    console.log('\n🎉 Análise do banco PostgreSQL concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante análise:', error);
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detalhe: ${error.detail}`);
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar análise
analyzePostgreSQLDatabase();