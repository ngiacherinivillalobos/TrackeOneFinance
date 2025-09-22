const axios = require('axios');

async function testCardCreation() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido! Token obtido.');
    
    // Agora testar a criação de um cartão
    console.log('Testando criação de cartão...');
    const cardData = {
      name: 'Cartão de Teste',
      card_number: '1234',
      expiry_date: '12/2025',
      brand: 'Visa',
      closing_day: 15,
      due_day: 10
    };
    
    const cardResponse = await axios.post('http://localhost:3001/api/cards', cardData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Cartão criado com sucesso!');
    console.log('Dados do cartão criado:', cardResponse.data);
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response ? error.response.data : error.message);
  }
}

testCardCreation();