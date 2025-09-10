const axios = require('axios');

// Testar a API em produção
async function testProductionAPI() {
  try {
    console.log('Testando API em produção...');
    
    // Testar endpoint de status de pagamento
    console.log('\n--- Testando Status de Pagamento ---');
    const paymentStatusResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/payment-statuses');
    console.log('Status de pagamento:', paymentStatusResponse.data);
    
    // Testar endpoint de transações filtradas
    console.log('\n--- Testando Transações Filtradas ---');
    const filteredTransactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions/filtered?payment_status_id=overdue&dateFilterType=all');
    console.log('Transações vencidas (com filtro):', filteredTransactionsResponse.data.length);
    console.log('Amostra de transações vencidas:', filteredTransactionsResponse.data.slice(0, 3));
    
    // Testar endpoint de transações sem filtros
    console.log('\n--- Testando Todas as Transações ---');
    const allTransactionsResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/transactions/filtered?dateFilterType=all');
    console.log('Todas as transações:', allTransactionsResponse.data.length);
    
    // Verificar transações vencidas manualmente
    console.log('\n--- Verificando Transações Vencidas Manualmente ---');
    const allTransactions = allTransactionsResponse.data;
    const overdueTransactions = allTransactions.filter(t => {
      // Verificar se o status é diferente de pago (2) e a data é anterior a hoje
      const isNotPaid = t.payment_status_id !== 2;
      const transactionDate = new Date(t.transaction_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      transactionDate.setHours(0, 0, 0, 0);
      const isOverdue = transactionDate < today;
      
      console.log(`Transação ${t.id}: status=${t.payment_status_id}, data=${t.transaction_date}, vencida=${isOverdue}`);
      return isNotPaid && isOverdue;
    });
    
    console.log('Transações vencidas identificadas manualmente:', overdueTransactions.length);
    console.log('Amostra de transações vencidas identificadas:', overdueTransactions.slice(0, 3));
    
  } catch (error) {
    console.error('Erro ao testar API em produção:', error.response?.data || error.message);
  }
}

testProductionAPI();