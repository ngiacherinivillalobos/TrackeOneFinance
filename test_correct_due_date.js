const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testCorrectDueDate() {
  try {
    console.log('🧪 TESTE VENCIMENTO CORRIGIDO');
    console.log('📋 Cartão: Fechamento dia 10, Vencimento dia 15');
    console.log('📋 Como 15 > 10, vencimento deve ser no MÊS SEGUINTE');
    console.log('📋 Pagamento em 29/09/2025 → Vencimento esperado: 15/10/2025\n');
    
    const transactionId = 793;
    const paymentData = {
      payment_date: '2025-09-29',
      paid_amount: 100.00,
      payment_type: 'credit_card',
      card_id: 8, // Cartão Teste Vencimento
      observations: 'Teste vencimento corrigido'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const response = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      paymentData
    );
    
    console.log('✅ Transação marcada como paga\n');
    
    // Verificar a nova transação de cartão
    const cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=8`);
    
    const newTransaction = cardTransactions.data.find(t => 
      t.description.includes('Teste Vencimento Corrigido')
    );
    
    if (newTransaction) {
      console.log('✅ SUCESSO! Nova transação criada no cartão:');
      console.log('📄 Descrição:', newTransaction.description);
      console.log('💰 Valor: R$', newTransaction.amount);
      console.log('📅 Data da transação:', newTransaction.transaction_date);
      console.log('📅 Data de vencimento:', newTransaction.due_date);
      
      if (newTransaction.due_date === '2025-10-15') {
        console.log('\n🎉 PERFEITO! Vencimento corrigido com sucesso!');
        console.log('✅ Vencimento calculado corretamente: 15/10/2025');
        console.log('✅ Regra aplicada: Como dia de vencimento (15) > dia de fechamento (10), vencimento no mês seguinte');
      } else {
        console.log('\n❌ Data de vencimento ainda incorreta');
        console.log('📅 Recebido:', newTransaction.due_date);
        console.log('📅 Esperado: 2025-10-15');
      }
    } else {
      console.log('❌ Transação não foi criada no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testCorrectDueDate();