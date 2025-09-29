const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testMarkAsPaid() {
  try {
    console.log('🧪 Testando com a transação original "teset cartao"...');
    
    const transactionId = 1112; // Transação "teset cartao" de R$ 2000
    const paymentData = {
      payment_date: '2025-09-29',
      paid_amount: 2000.00, // Valor original da transação
      payment_type: 'credit_card',
      card_id: 4, // Cartão Atualizado
      observations: 'Teste com a transação original'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const response = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      paymentData
    );
    
    console.log('✅ Resposta da API:', response.data);
    
    // Verificar se a transação foi criada no cartão
    console.log('\n🔍 Verificando se apareceu na aba do cartão...');
    const cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const newTransaction = cardTransactions.data.find(t => t.description.includes('teset cartao'));
    if (newTransaction) {
      console.log('✅ SUCESSO! Transação apareceu na aba do cartão:');
      console.log({
        id: newTransaction.id,
        description: newTransaction.description,
        amount: newTransaction.amount,
        transaction_date: newTransaction.transaction_date,
        due_date: newTransaction.due_date
      });
    } else {
      console.log('❌ Transação não apareceu na aba do cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testMarkAsPaid();