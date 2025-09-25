// Script para testar se o proxy do Vercel está funcionando corretamente
const axios = require('axios');

async function testProxy() {
  try {
    console.log('Testando proxy do Vercel...');
    
    // Testar chamada para o endpoint de transações filtradas
    const response = await axios.get('https://trackeone-finance.vercel.app/api/transactions/filtered?transaction_type=investment&payment_status=paid&dateFilterType=all&cost_center_id=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Proxy funcionando corretamente');
    console.log('Status:', response.status);
    console.log('Dados:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
      
      // Se for 401 (não autorizado), é o comportamento esperado
      if (error.response.status === 401) {
        console.log('✅ Proxy funcionando corretamente (retornou 401 - Token não fornecido)');
      } else {
        console.log('❌ Erro inesperado:', error.response.status);
      }
    } else {
      console.log('❌ Erro de conexão:', error.message);
    }
  }
}

testProxy();