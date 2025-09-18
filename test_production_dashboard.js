const axios = require('axios');

async function testProductionDashboard() {
  try {
    console.log('🚀 Testando Dashboard em Produção...\n');
    
    // 1. Fazer login para obter o token
    console.log('🔐 Realizando login...');
    const loginResponse = await axios.post('https://trackeone-finance-api.onrender.com/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido\n');
    
    // Configurar header de autenticação
    const authHeader = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // 2. Testar endpoint de contas bancárias com saldos
    console.log('🏦 Testando contas bancárias com saldos...');
    const bankAccountsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/bank-accounts/balances', authHeader);
    console.log(`✅ Contas bancárias carregadas: ${bankAccountsResponse.data.length}`);
    if (bankAccountsResponse.data.length > 0) {
      console.log('   Primeira conta:', {
        name: bankAccountsResponse.data[0].name,
        initial_balance: bankAccountsResponse.data[0].initial_balance,
        current_balance: bankAccountsResponse.data[0].current_balance
      });
    }
    
    // 3. Testar endpoint de transações pagas
    console.log('\n💰 Testando transações pagas...');
    const paidTransactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions/filtered?payment_status=paid&dateFilterType=all', authHeader);
    console.log(`✅ Transações pagas carregadas: ${paidTransactionsResponse.data.length}`);
    
    // 4. Testar endpoint de fluxo de caixa
    console.log('\n📊 Testando fluxo de caixa...');
    const cashFlowResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/cash-flow', authHeader);
    console.log(`✅ Registros de fluxo de caixa carregados: ${cashFlowResponse.data.length}`);
    
    // 5. Testar endpoint do dashboard
    console.log('\n📈 Testando dados do dashboard...');
    const dashboardResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/dashboard/overview', authHeader);
    console.log('✅ Dados do dashboard:', dashboardResponse.data);
    
    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('✅ As melhorias no cálculo do saldo devem estar funcionando em produção.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

testProductionDashboard();