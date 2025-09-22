const axios = require('axios');

async function testCardList() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido! Token obtido.');
    
    // Agora testar a listagem de cartões
    console.log('Testando listagem de cartões...');
    
    const cardResponse = await axios.get('http://localhost:3001/api/cards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Cartões listados com sucesso!');
    console.log('Lista de cartões:', JSON.stringify(cardResponse.data, null, 2));
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response ? error.response.data : error.message);
  }
}

testCardList();