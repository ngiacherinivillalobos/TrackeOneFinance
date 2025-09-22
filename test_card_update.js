const axios = require('axios');

async function testCardUpdate() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido! Token obtido.');
    
    // Agora testar a atualização de um cartão
    console.log('Testando atualização de cartão...');
    const cardData = {
      name: 'Cartão de Teste Atualizado',
      card_number: '5678',
      expiry_date: '11/2026',
      brand: 'Mastercard',
      closing_day: 20,
      due_day: 15
    };
    
    const cardResponse = await axios.put('http://localhost:3001/api/cards/2', cardData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Cartão atualizado com sucesso!');
    console.log('Dados do cartão atualizado:', cardResponse.data);
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response ? error.response.data : error.message);
  }
}

testCardUpdate();