const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJuZ2lhY2hlcmluaUBnbWFpbC5jb20iLCJjb3N0X2NlbnRlcl9pZCI6MSwiaWF0IjoxNzU4MDU5ODA5LCJleHAiOjE3NjA2NTE4MDl9.1n1MXMRSxIwybgLAZkoaQoKgmHcgXY0w4Frh2kWaOn0';

axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

async function testReversePayment() {
  try {
    console.log('🧪 TESTE COMPLETO - Criar pagamento e reverter');
    console.log('='.repeat(50));
    
    // 1. Criar uma nova transação
    console.log('\n1️⃣ Criando nova transação para teste...');
    
    // Primeiro, criar no banco
    // (Aqui você criaria via SQL como fizemos antes)
    const transactionId = 1117; // Usar a transação já criada
    
    // 2. Marcar como paga com cartão
    console.log('\n2️⃣ Marcando transação como paga com cartão...');
    const paymentData = {
      payment_date: '2025-09-29',
      paid_amount: 300.00,
      payment_type: 'credit_card',
      card_id: 4,
      observations: 'Teste de reversão'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const markPaidResponse = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      paymentData
    );
    
    console.log('✅ Transação marcada como paga');
    
    // 3. Verificar se transação foi criada no cartão
    console.log('\n3️⃣ Verificando se transação foi criada no cartão...');
    let cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const createdTransaction = cardTransactions.data.find(t => 
      t.description.includes('Teste Final Nova Logica')
    );
    
    if (createdTransaction) {
      console.log('✅ Transação encontrada no cartão:');
      console.log('📄 ID:', createdTransaction.id);
      console.log('📄 Descrição:', createdTransaction.description);
      console.log('💰 Valor: R$', createdTransaction.amount);
    } else {
      console.log('❌ Transação não encontrada no cartão');
      return;
    }
    
    // 4. Reverter o pagamento
    console.log('\n4️⃣ Revertendo o pagamento...');
    
    const reverseResponse = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/reverse-payment`
    );
    
    console.log('✅ Pagamento revertido:', reverseResponse.data.message);
    
    // 5. Verificar se transação foi excluída do cartão
    console.log('\n5️⃣ Verificando se transação foi excluída do cartão...');
    cardTransactions = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=4`);
    
    const deletedTransaction = cardTransactions.data.find(t => 
      t.description.includes('Teste Final Nova Logica')
    );
    
    if (!deletedTransaction) {
      console.log('✅ SUCESSO! Transação foi excluída do cartão');
      console.log('🎉 Funcionalidade de reversão funcionando corretamente!');
    } else {
      console.log('❌ Transação ainda existe no cartão');
      console.log('📄 ID:', deletedTransaction.id);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TESTE CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testReversePayment();