const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testMarkAsPaid() {
  try {
    console.log('🧪 Testando marcação como pago com cartão...');
    
    const transactionId = 1115;
    const paymentData = {
      payment_date: '2025-09-29',
      paid_amount: 1500.00,
      payment_type: 'credit_card',
      card_id: 4, // Cartão Atualizado
      observations: 'Teste debug'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const response = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      paymentData
    );
    
    console.log('✅ Resposta da API:', response.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testMarkAsPaid();