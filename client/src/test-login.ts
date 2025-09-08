import api from './lib/axios';

// Teste simples de login
const testLogin = async () => {
  try {
    console.log('Iniciando teste de login...');
    const response = await api.post('/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    console.log('Login bem-sucedido:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Erro no teste de login:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

// Executar o teste
testLogin();