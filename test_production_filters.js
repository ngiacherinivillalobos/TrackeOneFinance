#!/usr/bin/env node

/**
 * Script para testar se os filtros estão funcionando em produção
 * Simula as chamadas que o frontend faz para carregar os dados dos filtros
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://trackeone-finance-api.onrender.com/api';
const LOGIN_DATA = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testFiltersInProduction() {
  console.log('🔄 Testando filtros em produção...\n');
  
  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResult = await makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(LOGIN_DATA)
    });
    
    if (!loginResult.success) {
      console.error('❌ Falha no login:', loginResult.data || loginResult.error);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login realizado com sucesso');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 2. Testar categorias
    console.log('\n2. Testando categorias...');
    const categoriesResult = await makeRequest(`${API_BASE_URL}/categories`, { headers });
    
    if (categoriesResult.success) {
      console.log(`✅ Categorias carregadas: ${categoriesResult.data.length} itens`);
      console.log('   Primeiras 3 categorias:');
      categoriesResult.data.slice(0, 3).forEach(cat => {
        console.log(`   - ${cat.name} (${cat.source_type})`);
      });
    } else {
      console.error('❌ Falha ao carregar categorias:', categoriesResult.data || categoriesResult.error);
    }
    
    // 3. Testar subcategorias
    console.log('\n3. Testando subcategorias...');
    const subcategoriesResult = await makeRequest(`${API_BASE_URL}/subcategories`, { headers });
    
    if (subcategoriesResult.success) {
      console.log(`✅ Subcategorias carregadas: ${subcategoriesResult.data.length} itens`);
      console.log('   Primeiras 3 subcategorias:');
      subcategoriesResult.data.slice(0, 3).forEach(sub => {
        console.log(`   - ${sub.name} (categoria_id: ${sub.category_id})`);
      });
    } else {
      console.error('❌ Falha ao carregar subcategorias:', subcategoriesResult.data || subcategoriesResult.error);
    }
    
    // 4. Testar centros de custo
    console.log('\n4. Testando centros de custo...');
    const costCentersResult = await makeRequest(`${API_BASE_URL}/cost-centers`, { headers });
    
    if (costCentersResult.success) {
      console.log(`✅ Centros de custo carregados: ${costCentersResult.data.length} itens`);
      console.log('   Todos os centros de custo:');
      costCentersResult.data.forEach(cc => {
        console.log(`   - ${cc.name}${cc.number ? ` (${cc.number})` : ''}`);
      });
    } else {
      console.error('❌ Falha ao carregar centros de custo:', costCentersResult.data || costCentersResult.error);
    }
    
    // 5. Testar status de pagamento
    console.log('\n5. Testando status de pagamento...');
    const paymentStatusResult = await makeRequest(`${API_BASE_URL}/payment-status`, { headers });
    
    if (paymentStatusResult.success) {
      console.log(`✅ Status de pagamento carregados: ${paymentStatusResult.data.length} itens`);
      console.log('   Todos os status:');
      paymentStatusResult.data.forEach(status => {
        console.log(`   - ${status.name}`);
      });
    } else {
      console.error('❌ Falha ao carregar status de pagamento:', paymentStatusResult.data || paymentStatusResult.error);
    }
    
    // 6. Testar contatos
    console.log('\n6. Testando contatos...');
    const contactsResult = await makeRequest(`${API_BASE_URL}/contacts`, { headers });
    
    if (contactsResult.success) {
      console.log(`✅ Contatos carregados: ${contactsResult.data.length} itens`);
      if (contactsResult.data.length > 0) {
        console.log('   Primeiros 3 contatos:');
        contactsResult.data.slice(0, 3).forEach(contact => {
          console.log(`   - ${contact.name}`);
        });
      }
    } else {
      console.error('❌ Falha ao carregar contatos:', contactsResult.data || contactsResult.error);
    }
    
    console.log('\n🎉 Teste de filtros concluído!');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

// Executar o teste
testFiltersInProduction();