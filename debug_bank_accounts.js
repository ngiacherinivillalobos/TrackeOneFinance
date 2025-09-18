const axios = require('axios');

const API_URL = 'https://trackeone-finance-api.onrender.com/api';

async function debugBankAccounts() {
  console.log('Debugando problema com contas bancárias...\n');
  
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
    
    // 2. Teste de contas bancárias básicas
    console.log('--- Testando Contas Bancárias Básicas ---');
    try {
      const bankAccountsResponse = await axios.get(`${API_URL}/bank-accounts`, config);
      console.log('✅ Contas bancárias carregadas:', bankAccountsResponse.data.length, 'itens');
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar contas bancárias:', error.response?.data || error.message);
      console.log('');
    }
    
    // 3. Teste do endpoint problemático com mais detalhes
    console.log('--- Testando Saldos das Contas Bancárias (Detalhado) ---');
    try {
      // Primeiro, vamos obter uma conta específica para testar
      const bankAccountsResponse = await axios.get(`${API_URL}/bank-accounts`, config);
      if (bankAccountsResponse.data && bankAccountsResponse.data.length > 0) {
        const accountId = bankAccountsResponse.data[0].id;
        console.log(`Testando conta ID: ${accountId}`);
        
        // Testar o endpoint de saldo individual
        const balanceResponse = await axios.get(`${API_URL}/bank-accounts/${accountId}/balance`, config);
        console.log('✅ Saldo individual carregado:', balanceResponse.data);
        console.log('');
      } else {
        console.log('Nenhuma conta bancária encontrada para testar');
        console.log('');
      }
    } catch (error) {
      console.log('❌ Erro ao carregar saldo individual:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('');
    }
    
    // 4. Teste do endpoint de todos os saldos
    console.log('--- Testando Todos os Saldos das Contas Bancárias ---');
    try {
      const balancesResponse = await axios.get(`${API_URL}/bank-accounts/balances`, config);
      console.log('✅ Todos os saldos carregados:', balancesResponse.data.length, 'itens');
      console.log('');
    } catch (error) {
      console.log('❌ Erro ao carregar todos os saldos:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('');
      
      // Vamos tentar entender melhor o erro
      if (error.response?.data?.details) {
        console.log('🔍 Análise do erro:');
        console.log('   O erro "CASE types integer and text cannot be matched" indica que');
        console.log('   estamos tentando comparar um valor inteiro com um texto na consulta SQL.');
        console.log('   Isso geralmente acontece quando uma coluna esperada como texto');
        console.log('   contém valores numéricos ou vice-versa.');
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

debugBankAccounts();