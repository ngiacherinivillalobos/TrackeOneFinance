const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testando login...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    
    console.log('Login bem-sucedido!');
    console.log('Token:', response.data.token);
    
    // Decodificar o token para verificar o payload
    const parts = response.data.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Payload do token:', payload);
    
  } catch (error) {
    console.error('Erro ao fazer login:', error.response?.data || error.message);
  }
};

testLogin();
