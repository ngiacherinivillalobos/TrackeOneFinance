#!/usr/bin/env node

// Script para verificar o status do deploy no Render
const axios = require('axios');

async function checkRenderStatus() {
  try {
    console.log('🔍 Verificando status do deploy no Render...');
    
    // URL do serviço no Render
    const serviceUrl = 'https://trackeone-finance-api.onrender.com';
    
    // Tentar acessar o endpoint de health check várias vezes
    console.log(`\n🏥 Verificando health check em ${serviceUrl}/api/health`);
    
    for (let i = 0; i < 5; i++) {
      try {
        console.log(`\nTentativa ${i + 1}/5...`);
        const response = await axios.get(`${serviceUrl}/api/health`, {
          timeout: 10000 // 10 segundos de timeout
        });
        
        console.log('✅ Health check bem-sucedido:');
        console.log('  Status:', response.status);
        console.log('  Data:', response.data);
        return;
      } catch (error) {
        console.log(`❌ Tentativa ${i + 1} falhou:`, error.message);
        if (i < 4) {
          console.log('Aguardando 5 segundos antes da próxima tentativa...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    console.log('\n❌ Todas as tentativas falharam. O serviço pode estar indisponível.');
    process.exit(1);
  } catch (error) {
    console.error('❌ Erro ao verificar status do Render:', error);
    process.exit(1);
  }
}

checkRenderStatus();