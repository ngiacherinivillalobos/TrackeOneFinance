const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

async function main() {
  try {
    console.log('=== Teste completo do Dashboard ===');
    
    // 1. Fazer login para obter token
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido. Token obtido.');
    
    // Configurar axios com o token
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 2. Testar endpoint de transações
    console.log('\n2. Testando endpoint de transações...');
    const transactionsResponse = await api.get('/transactions');
    console.log('Transações carregadas:', transactionsResponse.data.length);
    
    if (transactionsResponse.data.length > 0) {
      const firstTransaction = transactionsResponse.data[0];
      console.log('Primeira transação:', {
        id: firstTransaction.id,
        description: firstTransaction.description,
        amount: firstTransaction.amount,
        type: firstTransaction.transaction_type,
        is_paid: firstTransaction.is_paid,
        payment_status_id: firstTransaction.payment_status_id
      });
      
      // Verificar tipos
      console.log('Tipo de amount:', typeof firstTransaction.amount);
      console.log('Tipo de is_paid:', typeof firstTransaction.is_paid);
    }
    
    // 3. Testar filtros
    console.log('\n3. Testando filtros...');
    
    // Transações pagas
    const paidResponse = await api.get('/transactions?payment_status_id=2');
    console.log('Transações pagas:', paidResponse.data.length);
    
    // Receitas
    const incomeResponse = await api.get('/transactions?transaction_type=Receita');
    console.log('Receitas:', incomeResponse.data.length);
    
    // Despesas
    const expenseResponse = await api.get('/transactions?transaction_type=Despesa');
    console.log('Despesas:', expenseResponse.data.length);
    
    // Investimentos
    const investmentResponse = await api.get('/transactions?transaction_type=Investimento');
    console.log('Investimentos:', investmentResponse.data.length);
    
    // 4. Testar cálculos específicos que o Dashboard precisa
    console.log('\n4. Testando cálculos do Dashboard...');
    
    // Receitas pagas
    const paidIncomeResponse = await api.get('/transactions?transaction_type=Receita&payment_status_id=2');
    console.log('Receitas pagas:', paidIncomeResponse.data.length);
    
    // Despesas pagas
    const paidExpensesResponse = await api.get('/transactions?transaction_type=Despesa&payment_status_id=2');
    console.log('Despesas pagas:', paidExpensesResponse.data.length);
    
    // Investimentos pagos
    const paidInvestmentsResponse = await api.get('/transactions?transaction_type=Investimento&payment_status_id=2');
    console.log('Investimentos pagos:', paidInvestmentsResponse.data.length);
    
    console.log('\n=== Teste concluído com sucesso! ===');
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

main();