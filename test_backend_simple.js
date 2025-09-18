const axios = require('axios');

async function testBackend() {
  try {
    console.log('🚀 Testando Backend em Produção...\n');
    
    // Testar endpoint público
    console.log('🔍 Testando endpoint público /api/test...');
    const testResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/test');
    console.log('✅ Status:', testResponse.status);
    console.log('✅ Resposta:', testResponse.data);
    
    // Fazer login
    console.log('\n🔐 Fazendo login...');
    const loginResponse = await axios.post('https://trackeone-finance-api.onrender.com/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido');
    
    // Configurar headers de autenticação
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Testar endpoint de contas bancárias
    console.log('\n🏦 Testando contas bancárias...');
    const accountsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/bank-accounts', config);
    console.log('✅ Contas bancárias carregadas:', accountsResponse.data.length);
    
    // Testar endpoint de contas bancárias com saldos
    console.log('\n💰 Testando contas bancárias com saldos...');
    try {
      const balancesResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/bank-accounts/balances', config);
      console.log('✅ Contas com saldos carregadas:', balancesResponse.data.length);
      if (balancesResponse.data.length > 0) {
        console.log('   Primeira conta:', {
          name: balancesResponse.data[0].name,
          initial_balance: balancesResponse.data[0].initial_balance,
          current_balance: balancesResponse.data[0].current_balance
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar contas com saldos:', error.response?.data || error.message);
    }
    
    // Testar endpoint de transações
    console.log('\n📋 Testando transações...');
    const transactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions', config);
    console.log('✅ Transações carregadas:', transactionsResponse.data.length);
    
    console.log('\n🎉 Todos os testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

testBackend();