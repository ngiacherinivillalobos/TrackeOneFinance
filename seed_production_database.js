const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações adicionais para conexão mais robusta
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 1
});

async function seedProductionDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL de produção');

    // 1. Criar usuário administrador
    console.log('\n=== Criando usuário administrador ===');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (email, password, name, is_active) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active
    `, ['admin@example.com', adminPassword, 'Administrador', true]);
    
    console.log('✅ Usuário administrador criado/atualizado');

    // 2. Inserir tipos de categoria
    console.log('\n=== Inserindo tipos de categoria ===');
    const categoryTypes = [
      { name: 'Despesa', description: 'Gastos e despesas' },
      { name: 'Receita', description: 'Receitas e ganhos' },
      { name: 'Investimento', description: 'Investimentos e aplicações' }
    ];

    for (const type of categoryTypes) {
      await client.query(`
        INSERT INTO category_types (name, description) 
        VALUES ($1, $2) 
        ON CONFLICT (name) DO NOTHING
      `, [type.name, type.description]);
    }
    console.log('✅ Tipos de categoria inseridos');

    // 3. Inserir categorias
    console.log('\n=== Inserindo categorias ===');
    const categories = [
      { name: 'Alimentação', type: 'Despesa' },
      { name: 'Acordos', type: 'Despesa' },
      { name: 'Transporte', type: 'Despesa' },
      { name: 'Moradia', type: 'Despesa' },
      { name: 'Ajuste de Saldo', type: 'Receita' },
      { name: 'Salário', type: 'Receita' },
      { name: 'Freelance', type: 'Receita' },
      { name: 'Reserva', type: 'Investimento' },
      { name: 'Ações', type: 'Investimento' }
    ];

    for (const category of categories) {
      // Buscar o ID do tipo de categoria
      const typeResult = await client.query('SELECT id FROM category_types WHERE name = $1', [category.type]);
      if (typeResult.rows.length > 0) {
        const typeId = typeResult.rows[0].id;
        await client.query(`
          INSERT INTO categories (name, category_type_id) 
          VALUES ($1, $2) 
          ON CONFLICT (name) DO NOTHING
        `, [category.name, typeId]);
      }
    }
    console.log('✅ Categorias inseridas');

    // 4. Inserir subcategorias (básicas)
    console.log('\n=== Inserindo subcategorias ===');
    const subcategories = [
      { name: 'Restaurante', category: 'Alimentação' },
      { name: 'Mercado', category: 'Alimentação' },
      { name: 'Uber', category: 'Transporte' },
      { name: 'Gasolina', category: 'Transporte' }
    ];

    for (const sub of subcategories) {
      // Buscar o ID da categoria pai
      const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [sub.category]);
      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        await client.query(`
          INSERT INTO subcategories (name, category_id) 
          VALUES ($1, $2) 
          ON CONFLICT (name, category_id) DO NOTHING
        `, [sub.name, categoryId]);
      }
    }
    console.log('✅ Subcategorias inseridas');

    // 5. Inserir status de pagamento
    console.log('\n=== Inserindo status de pagamento ===');
    const paymentStatuses = [
      { id: 1, name: 'Em Aberto', description: 'Transação em aberto' },
      { id: 2, name: 'Pago', description: 'Transação paga' },
      { id: 3, name: 'Vencido', description: 'Transação vencida' }
    ];

    for (const status of paymentStatuses) {
      await client.query(`
        INSERT INTO payment_status (id, name, description) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description
      `, [status.id, status.name, status.description]);
    }
    console.log('✅ Status de pagamento inseridos');

    // 6. Inserir centros de custo
    console.log('\n=== Inserindo centros de custo ===');
    const costCenters = [
      { name: 'Administrador', number: '0001', description: 'Centro de custo administrativo' },
      { name: 'Pessoal', number: '0002', description: 'Gastos pessoais' }
    ];

    for (const center of costCenters) {
      await client.query(`
        INSERT INTO cost_centers (name, number, description) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (number) DO NOTHING
      `, [center.name, center.number, center.description]);
    }
    console.log('✅ Centros de custo inseridos');

    // 7. Inserir contatos
    console.log('\n=== Inserindo contatos ===');
    const contacts = [
      { name: 'Sistema', email: 'sistema@trackone.com', phone: null },
      { name: 'Administrador', email: 'admin@trackone.com', phone: null }
    ];

    for (const contact of contacts) {
      await client.query(`
        INSERT INTO contacts (name, email, phone) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (email) DO NOTHING
      `, [contact.name, contact.email, contact.phone]);
    }
    console.log('✅ Contatos inseridos');

    // 8. Inserir contas bancárias básicas
    console.log('\n=== Inserindo contas bancárias ===');
    const bankAccounts = [
      { name: 'Conta Principal', type: 'Conta Corrente', initial_balance: 0 },
      { name: 'Conta Poupança', type: 'Poupança', initial_balance: 0 }
    ];

    for (const account of bankAccounts) {
      await client.query(`
        INSERT INTO bank_accounts (name, type, initial_balance, current_balance) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (name) DO NOTHING
      `, [account.name, account.type, account.initial_balance, account.initial_balance]);
    }
    console.log('✅ Contas bancárias inseridas');

    client.release();
    console.log('\n🎉 Banco de dados de produção populado com sucesso!');
    console.log('\n📋 Dados criados:');
    console.log('   👤 Usuário: admin@example.com / senha: admin123');
    console.log('   📊 Categorias, subcategorias e status básicos');
    console.log('   🏦 Contas bancárias padrão');
    console.log('   🎯 Centros de custo básicos');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de produção:', error);
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  seedProductionDatabase();
}

module.exports = { seedProductionDatabase };