const axios = require('axios');

async function testCardPostgres() {
  try {
    // Definir variável de ambiente para usar PostgreSQL
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem-sucedido! Token obtido.');
    
    // Agora testar a criação de um cartão no PostgreSQL
    console.log('Testando criação de cartão no PostgreSQL...');
    const cardData = {
      name: 'Cartão PostgreSQL',
      card_number: '9999',
      expiry_date: '10/2027',
      brand: 'American Express',
      closing_day: 25,
      due_day: 20
    };
    
    const cardResponse = await axios.post('http://localhost:3001/api/cards', cardData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Cartão criado com sucesso no PostgreSQL!');
    console.log('Dados do cartão criado:', cardResponse.data);
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response ? error.response.data : error.message);
  }
}

testCardPostgres();