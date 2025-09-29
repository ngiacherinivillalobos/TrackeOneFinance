const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Token de teste - você pode usar qualquer string para teste em desenvolvimento
const TEST_TOKEN = 'test-token-for-development';

// Configurar headers padrão
axios.defaults.headers.common['Authorization'] = `Bearer ${TEST_TOKEN}`;

// Dados de teste
const testData = {
  // Transação de teste para ser marcada como paga
  transaction: {
    description: 'Teste - Compra no Supermercado',
    amount: 150.00,
    transaction_type: 'Despesa',
    category_id: 1,
    subcategory_id: 1,
    contact_id: 1,
    cost_center_id: 1,
    transaction_date: '2025-01-10',
    payment_status_id: 1 // Em aberto
  },
  
  // Dados de pagamento com cartão
  paymentData: {
    payment_date: '2025-01-15',
    paid_amount: 150.00,
    payment_type: 'credit_card',
    card_id: 1, // Assumindo que existe um cartão com ID 1
    observations: 'Teste de pagamento com cartão'
  }
};

async function testCreditCardPayment() {
  try {
    console.log('🧪 Iniciando teste de pagamento com cartão de crédito...\n');
    
    // 1. Criar uma transação de teste
    console.log('1. Criando transação de teste...');
    const createResponse = await axios.post(`${API_BASE_URL}/transactions`, testData.transaction);
    const transactionId = createResponse.data.id;
    console.log(`✅ Transação criada com ID: ${transactionId}\n`);
    
    // 2. Verificar se existe pelo menos um cartão
    console.log('2. Verificando cartões disponíveis...');
    const cardsResponse = await axios.get(`${API_BASE_URL}/cards`);
    const cards = cardsResponse.data;
    
    if (cards.length === 0) {
      console.log('❌ Nenhum cartão encontrado. Criando cartão de teste...');
      const cardData = {
        name: 'Cartão Teste',
        card_number: '1234',
        brand: 'Visa',
        closing_day: 15,
        due_day: 10
      };
      const cardResponse = await axios.post(`${API_BASE_URL}/cards`, cardData);
      testData.paymentData.card_id = cardResponse.data.id;
      console.log(`✅ Cartão criado com ID: ${cardResponse.data.id}`);
    } else {
      testData.paymentData.card_id = cards[0].id;
      console.log(`✅ Usando cartão existente ID: ${cards[0].id} - ${cards[0].name}`);
    }
    console.log('');
    
    // 3. Listar transações de cartão antes do pagamento
    console.log('3. Verificando transações de cartão antes do pagamento...');
    const cardTransactionsBefore = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=${testData.paymentData.card_id}`);
    console.log(`📊 Total de transações no cartão antes: ${cardTransactionsBefore.data.length}\n`);
    
    // 4. Marcar a transação como paga com cartão
    console.log('4. Marcando transação como paga com cartão...');
    console.log('Dados do pagamento:', JSON.stringify(testData.paymentData, null, 2));
    
    const paymentResponse = await axios.post(
      `${API_BASE_URL}/transactions/${transactionId}/mark-as-paid`,
      testData.paymentData
    );
    
    console.log('✅ Transação marcada como paga com sucesso!');
    console.log('Resposta:', JSON.stringify(paymentResponse.data, null, 2));
    console.log('');
    
    // 5. Verificar se a transação de cartão foi criada
    console.log('5. Verificando se transação de cartão foi criada...');
    const cardTransactionsAfter = await axios.get(`${API_BASE_URL}/credit-card-transactions?card_id=${testData.paymentData.card_id}`);
    
    console.log(`📊 Total de transações no cartão depois: ${cardTransactionsAfter.data.length}`);
    
    if (cardTransactionsAfter.data.length > cardTransactionsBefore.data.length) {
      console.log('✅ Nova transação de cartão foi criada automaticamente!');
      
      // Mostrar detalhes da nova transação
      const newTransaction = cardTransactionsAfter.data[0]; // Assumindo que é a mais recente
      console.log('📄 Detalhes da nova transação de cartão:');
      console.log({
        id: newTransaction.id,
        description: newTransaction.description,
        amount: newTransaction.amount,
        transaction_date: newTransaction.transaction_date,
        due_date: newTransaction.due_date,
        card_id: newTransaction.card_id,
        category_id: newTransaction.category_id,
        is_paid: newTransaction.is_paid
      });
    } else {
      console.log('❌ Transação de cartão não foi criada');
    }
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar o teste
testCreditCardPayment();