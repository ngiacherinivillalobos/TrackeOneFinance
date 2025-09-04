const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Função para testar o endpoint de transações
async function testTransactionsEndpoint() {
  try {
    console.log('=== Testando endpoint de transações ===');
    
    // Testar listagem de transações
    const response = await axios.get(`${API_BASE_URL}/transactions`);
    console.log('Status da resposta:', response.status);
    console.log('Número de transações retornadas:', response.data.length);
    
    // Verificar se as transações têm os campos necessários
    if (response.data.length > 0) {
      const firstTransaction = response.data[0];
      console.log('Primeira transação:', {
        id: firstTransaction.id,
        description: firstTransaction.description,
        amount: firstTransaction.amount,
        type: firstTransaction.transaction_type,
        is_paid: firstTransaction.is_paid,
        payment_status_id: firstTransaction.payment_status_id
      });
      
      // Verificar se amount é número
      console.log('Tipo de amount:', typeof firstTransaction.amount);
      
      // Verificar se is_paid existe e é booleano
      console.log('Tipo de is_paid:', typeof firstTransaction.is_paid);
    }
    
    // Testar filtro por tipo de transação
    console.log('\n=== Testando filtro por tipo de transação ===');
    const receitasResponse = await axios.get(`${API_BASE_URL}/transactions?transaction_type=Receita`);
    console.log('Receitas encontradas:', receitasResponse.data.length);
    
    const despesasResponse = await axios.get(`${API_BASE_URL}/transactions?transaction_type=Despesa`);
    console.log('Despesas encontradas:', despesasResponse.data.length);
    
    const investimentosResponse = await axios.get(`${API_BASE_URL}/transactions?transaction_type=Investimento`);
    console.log('Investimentos encontrados:', investimentosResponse.data.length);
    
    // Testar filtro por status de pagamento
    console.log('\n=== Testando filtro por status de pagamento ===');
    const pagasResponse = await axios.get(`${API_BASE_URL}/transactions?payment_status_id=2`);
    console.log('Transações pagas:', pagasResponse.data.length);
    
    if (pagasResponse.data.length > 0) {
      const firstPaid = pagasResponse.data[0];
      console.log('Primeira transação paga:', {
        description: firstPaid.description,
        amount: firstPaid.amount,
        type: firstPaid.transaction_type,
        is_paid: firstPaid.is_paid
      });
    }
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar o teste
testTransactionsEndpoint();