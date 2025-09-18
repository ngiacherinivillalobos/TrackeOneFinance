const axios = require('axios');

const API_URL = 'https://trackeone-finance-api.onrender.com/api';

async function testProductionAPI() {
  console.log('Testando API em produção...\n');
  
  try {
    // 1. Teste de health check
    console.log('--- Testando Health Check ---');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');
    
    // 2. Teste de login
    console.log('--- Testando Login ---');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido');
    console.log('Token obtido:', token ? 'Sim' : 'Não');
    console.log('');
    
    // Configurar headers com token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // 3. Teste de contas bancárias
    console.log('--- Testando Contas Bancárias ---');
    try {
      const bankAccountsResponse = await axios.get(`${API_URL}/bank-accounts`, config);
      console.log('✅ Contas bancárias carregadas:', bankAccountsResponse.data.length, 'itens');
      console.log('Primeira conta:', bankAccountsResponse.data[0] || 'Nenhuma conta encontrada');
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar contas bancárias:', error.response?.data || error.message);
      console.log('');
    }
    
    // 4. Teste de saldo das contas bancárias
    console.log('--- Testando Saldos das Contas Bancárias ---');
    try {
      const balancesResponse = await axios.get(`${API_URL}/bank-accounts/balances`, config);
      console.log('✅ Saldos das contas carregados:', balancesResponse.data.length, 'itens');
      console.log('Primeiro saldo:', balancesResponse.data[0] || 'Nenhuma conta encontrada');
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar saldos das contas:', error.response?.data || error.message);
      console.log('');
    }
    
    // 5. Teste de transações
    console.log('--- Testando Transações ---');
    try {
      const transactionsResponse = await axios.get(`${API_URL}/transactions`, config);
      console.log('✅ Transações carregadas:', transactionsResponse.data.length, 'itens');
      console.log('Primeira transação:', transactionsResponse.data[0] || 'Nenhuma transação encontrada');
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar transações:', error.response?.data || error.message);
      console.log('');
    }
    
    // 6. Teste do dashboard
    console.log('--- Testando Dashboard ---');
    try {
      const dashboardResponse = await axios.get(`${API_URL}/dashboard/overview`, config);
      console.log('✅ Dados do dashboard carregados');
      console.log('Dados:', Object.keys(dashboardResponse.data || {}));
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar dashboard:', error.response?.data || error.message);
      console.log('');
    }
    
    console.log('✅ Todos os testes concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao testar API em produção:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testProductionAPI();