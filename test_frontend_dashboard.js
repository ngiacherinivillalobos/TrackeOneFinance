const axios = require('axios');

const FRONTEND_URL = 'https://client-pdvt1suho-natali-giacherini-villalobos-projects.vercel.app';
const API_URL = 'https://trackeone-finance-api.onrender.com/api';

async function testFrontendDashboard() {
  console.log('Testando frontend do dashboard...\n');
  
  try {
    // 1. Teste de login
    console.log('--- Testando Login ---');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido');
    console.log('');
    
    // Configurar headers com token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // 2. Testar endpoint de overview do dashboard
    console.log('--- Testando Overview do Dashboard ---');
    try {
      // Este é o endpoint que o frontend usa para carregar os dados do dashboard
      const overviewResponse = await axios.get(`${API_URL}/dashboard/overview`, config);
      console.log('✅ Overview do dashboard carregado com sucesso');
      console.log('Dados recebidos:', Object.keys(overviewResponse.data));
      console.log('');
    } catch (error) {
      console.log('ℹ️  Endpoint de overview não encontrado (pode ser normal)');
      console.log('Detalhes:', error.response?.data || error.message);
      console.log('');
    }
    
    // 3. Testar endpoints individuais que o dashboard usa
    console.log('--- Testando Endpoints Individuais ---');
    
    // Transações filtradas (usado no dashboard)
    try {
      const filteredTransactions = await axios.get(`${API_URL}/transactions/filtered?dateFilterType=all&payment_status=paid`, config);
      console.log('✅ Transações filtradas carregadas:', filteredTransactions.data.length, 'itens');
    } catch (error) {
      console.log('❌ Erro ao carregar transações filtradas:', error.response?.data || error.message);
    }
    
    // Contas bancárias com saldos
    try {
      const bankAccounts = await axios.get(`${API_URL}/bank-accounts/balances`, config);
      console.log('❌ Contas bancárias com saldos ainda com erro:', bankAccounts.data.error || 'Erro desconhecido');
    } catch (error) {
      console.log('❌ Erro ao carregar contas bancárias com saldos:', error.response?.data || error.message);
    }
    
    // Fluxo de caixa
    try {
      const cashFlow = await axios.get(`${API_URL}/cash-flow`, config);
      console.log('✅ Fluxo de caixa carregado:', cashFlow.data.length, 'itens');
    } catch (error) {
      console.log('❌ Erro ao carregar fluxo de caixa:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Teste de frontend concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testFrontendDashboard();