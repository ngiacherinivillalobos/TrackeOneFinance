const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testNewLogic() {
  try {
    console.log('🧪 Testando nova lógica de vencimento...');
    console.log('📋 Cartão Atualizado: Fechamento dia 30, Vencimento dia 10');
    console.log('📋 Regra: Como 10 < 30, vencimento deve ser no MÊS SEGUINTE');
    console.log('📋 Pagamento em 29/09/2025 → Vencimento esperado: 10/10/2025\n');
    
    const transactionId = 1116; // Nova transação de teste
    const paymentData = {
      payment_date: '2025-09-29',
      paid_amount: 500.00,
      payment_type: 'credit_card',
      card_id: 4, // Cartão Atualizado
      observations: 'Teste nova lógica de vencimento'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const response = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      paymentData
    );
    
    console.log('✅ Transação marcada como paga\n');
    
    // Verificar a nova transação de cartão
    const cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const newTransaction = cardTransactions.data.find(t => t.description.includes('Teste Nova Logica Vencimento'));
    if (newTransaction) {
      console.log('✅ SUCESSO! Nova transação criada no cartão:');
      console.log('📄 Descrição:', newTransaction.description);
      console.log('💰 Valor: R$', newTransaction.amount);
      console.log('📅 Data da transação:', newTransaction.transaction_date);
      console.log('📅 Data de vencimento:', newTransaction.due_date);
      
      if (newTransaction.due_date === '2025-10-10') {
        console.log('\n🎉 PERFEITO! A lógica está correta!');
        console.log('✅ Vencimento calculado corretamente: 10/10/2025');
      } else {
        console.log('\n❌ Data de vencimento incorreta. Esperado: 2025-10-10');
      }
    } else {
      console.log('❌ Transação não foi criada no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testNewLogic();