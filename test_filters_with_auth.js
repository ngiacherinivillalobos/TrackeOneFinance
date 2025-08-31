const axios = require('axios');

// Configurar a instância do axios
const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

async function login() {
  try {
    // Primeiro, vamos tentar criar um usuário de teste se não existir
    console.log('Tentando fazer login...');
    
    const response = await api.post('/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = response.data.token;
    console.log('Login bem-sucedido!');
    console.log('Token obtido:', token.substring(0, 20) + '...');
    
    // Configurar o token para requisições futuras
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return token;
  } catch (error) {
    console.error('Erro no login:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    throw error;
  }
}

// Testar os filtros de centro de custo
async function testCostCenterFilters() {
  try {
    console.log('\n=== Testando Filtros de Centro de Custo ===\n');
    
    // Testar filtro com um centro de custo
    console.log('1. Testando filtro com um centro de custo...');
    const response1 = await api.get('/transactions', {
      params: {
        cost_center_id: '1'
      }
    });
    console.log(`   Resultados encontrados: ${response1.data.length}`);
    
    // Testar filtro com múltiplos centros de custo
    console.log('\n2. Testando filtro com múltiplos centros de custo...');
    const response2 = await api.get('/transactions', {
      params: {
        cost_center_id: '1,2'
      }
    });
    console.log(`   Resultados encontrados: ${response2.data.length}`);
    
    // Testar filtro com todos os centros de custo
    console.log('\n3. Testando filtro sem centro de custo específico (todos)...');
    const response3 = await api.get('/transactions');
    console.log(`   Resultados encontrados: ${response3.data.length}`);
    
    console.log('\n=== Testes de Transações concluídos com sucesso! ===');
  } catch (error) {
    console.error('Erro durante os testes de transações:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Testar os filtros de centro de custo no Cash Flow
async function testCashFlowFilters() {
  try {
    console.log('\n=== Testando Filtros de Centro de Custo no Cash Flow ===\n');
    
    // Testar filtro com um centro de custo
    console.log('1. Testando filtro com um centro de custo no Cash Flow...');
    const response1 = await api.get('/cash-flow', {
      params: {
        cost_center_id: '1'
      }
    });
    console.log(`   Resultados encontrados: ${response1.data.length}`);
    
    // Testar filtro com múltiplos centros de custo
    console.log('\n2. Testando filtro com múltiplos centros de custo no Cash Flow...');
    const response2 = await api.get('/cash-flow', {
      params: {
        cost_center_id: '1,2'
      }
    });
    console.log(`   Resultados encontrados: ${response2.data.length}`);
    
    console.log('\n=== Testes do Cash Flow concluídos! ===');
  } catch (error) {
    console.error('Erro durante os testes do Cash Flow:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  try {
    // Tentar fazer login primeiro
    await login();
    
    // Executar os testes
    await testCostCenterFilters();
    await testCashFlowFilters();
    
    console.log('\n=== TODOS OS TESTES FORAM CONCLUÍDOS ===');
  } catch (error) {
    console.error('\nErro durante a execução dos testes:', error.message);
  }
}

// Executar os testes
runAllTests();