#!/usr/bin/env node

// Script para diagnosticar problemas de deploy no Render
const axios = require('axios');
const https = require('https');

console.log('🔍 Diagnosticando problemas de deploy no Render...\n');

// Desabilitar verificação de certificado SSL para testes
const agent = new https.Agent({  
  rejectUnauthorized: false
});

// URLs para testar
const urlsToTest = [
  'https://trackeone-finance-api.onrender.com/api/health',
  'https://trackeone-finance-api.onrender.com/api/auth/login',
  'https://trackeone-finance-api.onrender.com/'
];

async function testUrls() {
  console.log('🧪 Testando URLs do backend...\n');
  
  for (const url of urlsToTest) {
    try {
      console.log(`🔍 Testando: ${url}`);
      const response = await axios.get(url, { 
        timeout: 10000,
        httpsAgent: agent,
        validateStatus: () => true // Não rejeitar com base no status
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'N/A'}`);
      
      if (response.data) {
        if (typeof response.data === 'object') {
          console.log(`   📦 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        } else {
          console.log(`   📦 Response: ${response.data.toString().substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ Erro: Domínio não encontrado`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Erro: Conexão recusada`);
      } else if (error.code === 'ECONNRESET') {
        console.log(`   ❌ Erro: Conexão resetada`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ Erro: Tempo de conexão esgotado`);
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('📋 Instruções para correção:');
  console.log('   1. Acesse https://dashboard.render.com');
  console.log('   2. Verifique se o serviço "trackeone-finance-api" está "Live"');
  console.log('   3. Confirme a URL correta do serviço no dashboard');
  console.log('   4. Atualize a variável de ambiente VITE_API_URL no frontend');
  console.log('   5. Faça um novo deploy do frontend');
  console.log('');
  console.log('📄 Consulte o arquivo FIX_RENDER_DEPLOYMENT.md para mais detalhes');
}

// Executar diagnóstico
testUrls();