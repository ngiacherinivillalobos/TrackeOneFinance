const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@trackone.com',
  password: 'admin123'
};

// Função para testar o endpoint de teste
async function testApiEndpoint() {
  console.log('=== Teste de Endpoint da API ===\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/test`);
    console.log('✅ Endpoint de teste acessado com sucesso');
    console.log('Resposta:', response.data);
    console.log();
  } catch (error) {
    console.error('❌ Erro ao acessar endpoint de teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Função para testar o login
async function testLogin() {
  console.log('=== Teste de Login ===\n');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER);
    console.log('✅ Login realizado com sucesso');
    console.log('Token recebido:', response.data.token ? 'Sim' : 'Não');
    console.log();
    
    // Testar validação do token
    if (response.data.token) {
      await testTokenValidation(response.data.token);
    }
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Função para testar a validação do token
async function testTokenValidation(token) {
  console.log('=== Teste de Validação de Token ===\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token validado com sucesso');
    console.log('Resposta:', response.data);
    console.log();
  } catch (error) {
    console.error('❌ Erro na validação do token:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Função para testar endpoints protegidos
async function testProtectedEndpoints(token) {
  console.log('=== Teste de Endpoints Protegidos ===\n');
  
  const endpoints = [
    '/api/categories',
    '/api/bank-accounts',
    '/api/contacts'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ ${endpoint} acessado com sucesso (${Array.isArray(response.data) ? response.data.length : 'N/A'} registros)`);
    } catch (error) {
      console.error(`❌ Erro ao acessar ${endpoint}:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes da API TrackOne Finance\n');
  
  // Testar endpoint público
  await testApiEndpoint();
  
  // Testar autenticação
  const token = await testLogin();
  
  // Testar endpoints protegidos se o login foi bem-sucedido
  if (token) {
    await testProtectedEndpoints(token);
  }
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar testes
main().catch(console.error);