// Arquivo de teste para verificar a API do servidor
const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testAPI() {
  try {
    console.log('Testando conexão com o servidor...');
    const testResponse = await axios.get(`${baseURL}/test`);
    console.log('Resposta do teste:', testResponse.data);
    
    // Testar login
    console.log('\nTestando login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    console.log('Login bem-sucedido, token recebido');
    const token = loginResponse.data.token;
    
    // Configurar o header de autenticação para as próximas requisições
    const authHeader = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Testar rota de categorias (requer autenticação)
    console.log('\nTestando rota de categorias...');
    const categoriesResponse = await axios.get(`${baseURL}/categories`, authHeader);
    console.log('Categorias carregadas com sucesso:', categoriesResponse.data.length, 'itens');
    
    // Testar rota de transações (requer autenticação)
    console.log('\nTestando rota de transações...');
    const transactionsResponse = await axios.get(`${baseURL}/transactions`, authHeader);
    console.log('Transações carregadas com sucesso:', transactionsResponse.data.length, 'itens');
    
    // Testar rota de cash flow (requer autenticação)
    console.log('\nTestando rota de cash flow...');
    const cashFlowResponse = await axios.get(`${baseURL}/cash-flow`, authHeader);
    console.log('Cash flow carregado com sucesso:', cashFlowResponse.data.length, 'itens');
    
    console.log('\nTodos os testes passaram com sucesso!');
  } catch (error) {
    console.error('Erro ao testar API:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

testAPI();