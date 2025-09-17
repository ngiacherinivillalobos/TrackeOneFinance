const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do pool de conexão com o PostgreSQL (igual ao apply_postgres_migrations.js)
const pool = new Pool({
  connectionString: "postgresql://trackone_user:jFaP2T3NXFVR5Vd6XECePPxkH1VaX5Rz@dpg-cs1q4cbv2p9s73b7nm9g-a.oregon-postgres.render.com/trackone_finance",
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedEssentialData() {
  let client;
  try {
    console.log('🔄 Conectando ao banco de produção...');
    client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se já existem usuários
    const userCheck = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total de usuários existentes: ${userCheck.rows[0].total}`);

    // 1. CRIAR USUÁRIO ADMIN
    console.log('\n=== CRIANDO USUÁRIO ADMIN ===');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await client.query(`
      INSERT INTO users (name, email, password, is_admin, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        is_admin = EXCLUDED.is_admin,
        updated_at = NOW()
    `, ['Administrador', 'admin@example.com', adminPassword, true]);
    console.log('✅ Usuário admin criado');

    // 2. POPULAR CATEGORIAS BÁSICAS
    console.log('\n=== CRIANDO CATEGORIAS ===');
    const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];
    
    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, created_at)
        VALUES ($1, NOW())
        ON CONFLICT (name) DO NOTHING
      `, [cat]);
    }
    console.log('✅ Categorias criadas');

    // 3. POPULAR STATUS DE PAGAMENTO
    console.log('\n=== CRIANDO STATUS DE PAGAMENTO ===');
    const statuses = ['Pendente', 'Pago', 'Vencido'];
    
    for (const status of statuses) {
      await client.query(`
        INSERT INTO payment_status (name, created_at)
        VALUES ($1, NOW())
        ON CONFLICT (name) DO NOTHING
      `, [status]);
    }
    console.log('✅ Status de pagamento criados');

    // 4. POPULAR CENTROS DE CUSTO
    console.log('\n=== CRIANDO CENTROS DE CUSTO ===');
    const costCenters = ['Pessoal', 'Empresa'];
    
    for (const cc of costCenters) {
      await client.query(`
        INSERT INTO cost_centers (name, created_at)
        VALUES ($1, NOW())
        ON CONFLICT (name) DO NOTHING
      `, [cc]);
    }
    console.log('✅ Centros de custo criados');

    // Verificar dados inseridos
    console.log('\n=== VERIFICANDO DADOS ===');
    const finalUserCount = await client.query('SELECT COUNT(*) as total FROM users');
    const categoryCount = await client.query('SELECT COUNT(*) as total FROM categories');
    const statusCount = await client.query('SELECT COUNT(*) as total FROM payment_status');
    const costCenterCount = await client.query('SELECT COUNT(*) as total FROM cost_centers');

    console.log(`👥 Total de usuários: ${finalUserCount.rows[0].total}`);
    console.log(`📂 Total de categorias: ${categoryCount.rows[0].total}`);
    console.log(`📋 Total de status: ${statusCount.rows[0].total}`);
    console.log(`🏢 Total de centros de custo: ${costCenterCount.rows[0].total}`);

    console.log('\n🎉 DADOS ESSENCIAIS POPULADOS COM SUCESSO!');
    console.log('\n=== CREDENCIAIS DE LOGIN ===');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Senha: admin123');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar o seeding
seedEssentialData();