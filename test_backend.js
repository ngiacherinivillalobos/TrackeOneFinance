#!/usr/bin/env node

// Script para testar a conexão com o backend
const axios = require('axios');

async function testBackend() {
  try {
    console.log('🔍 Testando conexão com o backend...');
    
    // URL do backend no Render
    const backendUrl = 'https://trackeone-finance-api.onrender.com';
    
    // Testar endpoint de health check
    console.log(`\n🧪 Testando endpoint de health check: ${backendUrl}/api/health`);
    const healthResponse = await axios.get(`${backendUrl}/api/health`);
    console.log('✅ Health check response:', healthResponse.data);
    
    // Testar endpoint de teste
    console.log(`\n🧪 Testando endpoint de teste: ${backendUrl}/api/test`);
    const testResponse = await axios.get(`${backendUrl}/api/test`);
    console.log('✅ Test endpoint response:', testResponse.data);
    
    // Testar endpoint de transações (sem autenticação)
    console.log(`\n🧪 Testando endpoint de transações: ${backendUrl}/api/transactions`);
    try {
      const transactionsResponse = await axios.get(`${backendUrl}/api/transactions`);
      console.log('✅ Transactions endpoint response status:', transactionsResponse.status);
    } catch (error) {
      if (error.response) {
        console.log('ℹ️  Transactions endpoint response status:', error.response.status);
        console.log('ℹ️  Transactions endpoint response data:', error.response.data);
      } else {
        console.log('ℹ️  Erro ao acessar transactions endpoint:', error.message);
      }
    }
    
    console.log('\n✅ Todos os testes concluídos com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao testar conexão com o backend:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testBackend();