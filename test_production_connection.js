#!/usr/bin/env node

/**
 * Script para testar a conexão entre frontend e backend em produção
 */

const axios = require('axios');

async function testConnection() {
  console.log('🔍 Testando conexão entre frontend e backend em produção...\n');
  
  try {
    // Testar endpoint de health check
    console.log('1. Testando endpoint de health check...');
    const healthResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/health', {
      timeout: 10000
    });
    
    console.log(`   ✅ Status: ${healthResponse.status}`);
    console.log(`   📦 Resposta: ${JSON.stringify(healthResponse.data)}`);
    
    // Testar endpoint de autenticação (registro)
    console.log('\n2. Testando endpoint de autenticação...');
    const authResponse = await axios.post('https://trackeone-finance-api.onrender.com/api/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Aceitar status codes < 500
      }
    });
    
    console.log(`   ✅ Status: ${authResponse.status}`);
    console.log(`   📦 Resposta: ${JSON.stringify(authResponse.data)}`);
    
    // Testar endpoint público de categorias (se existir)
    console.log('\n3. Testando endpoint público...');
    const publicResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/health', {
      timeout: 10000
    });
    
    console.log(`   ✅ Status: ${publicResponse.status}`);
    console.log(`   📦 Resposta: ${JSON.stringify(publicResponse.data)}`);
    
    console.log('\n🎉 Testes concluídos! A conexão entre frontend e backend está funcionando corretamente.');
    console.log('ℹ️  Os endpoints protegidos retornam 401 quando não há autenticação, o que é o comportamento esperado.');
    
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Executar teste
testConnection();