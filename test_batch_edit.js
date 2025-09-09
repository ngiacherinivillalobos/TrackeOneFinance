const axios = require('axios');

async function testBatchEdit() {
  try {
    // Primeiro fazer login para obter um token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'ngiacherini@gmail.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido. Token obtido.');
    
    // Agora testar o batch edit
    console.log('2. Testando batch edit...');
    const batchEditResponse = await axios.post('http://localhost:3001/api/transactions/batch-edit', {
      transactionIds: [1066, 1067],
      updates: {
        payment_status_id: 2
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Batch edit bem-sucedido:', batchEditResponse.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testBatchEdit();
