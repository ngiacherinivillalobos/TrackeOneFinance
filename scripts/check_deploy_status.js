#!/usr/bin/env node

/**
 * Script para verificar o status do deploy do TrackeOne Finance
 * Verifica se os serviços estão funcionando corretamente
 */

const axios = require('axios');
const https = require('https');

// Configuração do agente HTTPS para ignorar certificados autoassinados (apenas para testes)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// URLs dos serviços (substitua pelas suas URLs reais)
const SERVICES = {
  backend: {
    name: 'Backend API',
    url: process.env.BACKEND_URL || 'https://trackeone-finance-api.onrender.com',
    endpoints: ['/api/health']  // Alterado para usar o endpoint de health check
  },
  frontend: {
    name: 'Frontend',
    url: process.env.FRONTEND_URL || 'https://trackeone-finance.vercel.app',
    endpoints: ['/']
  }
};

// Função para verificar um serviço
const checkService = async (service) => {
  console.log(`🔍 Verificando ${service.name}...`);
  
  const results = [];
  
  for (const endpoint of service.endpoints) {
    const url = `${service.url}${endpoint}`;
    try {
      console.log(`   Testando: ${url}`);
      const response = await axios.get(url, { 
        timeout: 10000,
        httpsAgent
      });
      
      results.push({
        endpoint,
        status: '✅ OK',
        statusCode: response.status,
        responseTime: response.headers['response-time'] || 'N/A'
      });
    } catch (error) {
      results.push({
        endpoint,
        status: '❌ ERRO',
        error: error.message,
        statusCode: error.response ? error.response.status : 'N/A'
      });
    }
  }
  
  return {
    serviceName: service.name,
    url: service.url,
    results
  };
};

// Função para exibir resultados
const displayResults = (serviceResults) => {
  console.log('\n📊 RESULTADOS DA VERIFICAÇÃO\n' + '='.repeat(50));
  
  serviceResults.forEach(service => {
    console.log(`\n📍 ${service.serviceName}: ${service.url}`);
    console.log('-'.repeat(40));
    
    service.results.forEach(result => {
      console.log(`   ${result.status} ${result.endpoint}`);
      if (result.statusCode !== 'N/A') {
        console.log(`      Status: ${result.statusCode}`);
      }
      if (result.error) {
        console.log(`      Erro: ${result.error}`);
      }
    });
  });
};

// Função principal
const checkDeployStatus = async () => {
  console.log('🚀 Verificando status do deploy do TrackeOne Finance...\n');
  
  try {
    // Verificar todos os serviços
    const serviceChecks = Object.values(SERVICES).map(service => checkService(service));
    const results = await Promise.all(serviceChecks);
    
    // Exibir resultados
    displayResults(results);
    
    // Verificar se todos os serviços estão OK
    const allOK = results.every(service => 
      service.results.every(result => result.status.includes('OK'))
    );
    
    console.log('\n' + '='.repeat(50));
    if (allOK) {
      console.log('✅ Todos os serviços estão funcionando corretamente!');
      console.log('🎉 Deploy concluído com sucesso!');
    } else {
      console.log('⚠️  Alguns serviços estão com problemas.');
      console.log('🔧 Verifique os erros acima e tome as devidas providências.');
    }
    
    return allOK;
  } catch (error) {
    console.error('❌ Erro ao verificar status do deploy:', error.message);
    return false;
  }
};

// Executar verificação
if (require.main === module) {
  checkDeployStatus().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkDeployStatus };