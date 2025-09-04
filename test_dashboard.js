const axios = require('axios');

// Testar o endpoint do Dashboard
async function testDashboard() {
  try {
    console.log('=== Teste do Dashboard ===\n');
    
    // Primeiro fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('https://trackeone-finance-api.onrender.com/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido\n');
    
    // Testar o endpoint de transações para o Dashboard
    console.log('Testando endpoint de transações para o Dashboard...');
    const transactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions?transaction_type=Investimento&is_paid=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Transações de investimento pagas encontradas: ${transactionsResponse.data.length}`);
    
    if (transactionsResponse.data.length > 0) {
      console.log('\nExaminando os registros:');
      transactionsResponse.data.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}, Descrição: ${record.description}, Valor: ${record.amount}, Tipo: ${record.transaction_type}, Pago: ${record.is_paid}`);
        console.log(`   Tipo do valor: ${typeof record.amount}`);
      });
      
      // Calcular total
      const total = transactionsResponse.data
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
      console.log(`\nTotal de investimentos pagos: ${total}`);
    }
    
    // Testar o endpoint de todas as transações
    console.log('\nTestando endpoint de todas as transações...');
    const allTransactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Total de transações encontradas: ${allTransactionsResponse.data.length}`);
    
    // Separar por tipo
    const receitas = allTransactionsResponse.data.filter(t => t.transaction_type === 'Receita');
    const despesas = allTransactionsResponse.data.filter(t => t.transaction_type === 'Despesa');
    const investimentos = allTransactionsResponse.data.filter(t => t.transaction_type === 'Investimento');
    
    console.log(`Receitas: ${receitas.length}`);
    console.log(`Despesas: ${despesas.length}`);
    console.log(`Investimentos: ${investimentos.length}`);
    
    // Calcular receitas pagas
    const receitasPagas = receitas.filter(t => t.is_paid);
    const totalReceitasPagas = receitasPagas.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log(`\nReceitas pagas: ${receitasPagas.length} registros, total: ${totalReceitasPagas}`);
    
    // Calcular despesas pagas
    const despesasPagas = despesas.filter(t => t.is_paid);
    const totalDespesasPagas = despesasPagas.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log(`Despesas pagas: ${despesasPagas.length} registros, total: ${totalDespesasPagas}`);
    
    // Calcular investimentos pagos
    const investimentosPagos = investimentos.filter(t => t.is_paid);
    const totalInvestimentosPagos = investimentosPagos.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log(`Investimentos pagos: ${investimentosPagos.length} registros, total: ${totalInvestimentosPagos}`);
    
    // Total pago
    const totalPago = totalReceitasPagas + totalDespesasPagas + totalInvestimentosPagos;
    console.log(`\nTotal pago (receitas + despesas + investimentos): ${totalPago}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Executar o teste
testDashboard();