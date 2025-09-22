const axios = require('axios');

async function testCardDelete() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido! Token obtido.');
    
    // Agora testar a exclusão de um cartão
    console.log('Testando exclusão de cartão...');
    
    const cardResponse = await axios.delete('http://localhost:3001/api/cards/2', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Cartão excluído com sucesso!');
    console.log('Resposta da exclusão:', cardResponse.data);
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response ? error.response.data : error.message);
  }
}

testCardDelete();