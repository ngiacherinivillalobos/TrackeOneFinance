const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testOnlyReverse() {
  try {
    console.log('🧪 TESTE DE REVERSÃO');
    console.log('📋 Transação: 1117 (Teste Final Nova Logica)');
    console.log('📋 Transação de cartão: ID 12');
    
    // 1. Verificar se transação existe no cartão
    console.log('\n1️⃣ Verificando transação no cartão antes da reversão...');
    let cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const beforeTransaction = cardTransactions.data.find(t => t.id === 12);
    if (beforeTransaction) {
      console.log('✅ Transação ID 12 encontrada no cartão:');
      console.log('📄 Descrição:', beforeTransaction.description);
      console.log('📄 Observações:', beforeTransaction.payment_observations);
    } else {
      console.log('❌ Transação ID 12 não encontrada');
      return;
    }
    
    // 2. Reverter o pagamento
    console.log('\n2️⃣ Revertendo pagamento da transação 1117...');
    
    const reverseResponse = await axios.post(
      `${API_BASE_URL}/transactions/1117/reverse-payment`
    );
    
    console.log('✅ Resposta da reversão:', reverseResponse.data.message);
    
    // 3. Verificar se transação foi excluída do cartão
    console.log('\n3️⃣ Verificando se transação foi excluída do cartão...');
    cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const afterTransaction = cardTransactions.data.find(t => t.id === 12);
    if (!afterTransaction) {
      console.log('✅ SUCESSO! Transação ID 12 foi excluída do cartão');
      console.log('🎉 Funcionalidade de reversão funcionando!');
    } else {
      console.log('❌ Transação ID 12 ainda existe no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testOnlyReverse();