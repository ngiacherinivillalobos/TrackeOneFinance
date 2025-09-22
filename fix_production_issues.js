// Script para diagnosticar e corrigir problemas de produção
const axios = require('axios');
const fs = require('fs');

console.log('=== CORREÇÃO DE PROBLEMAS DE PRODUÇÃO ===');

// Função para verificar e corrigir problemas de timeout
const fixTimeoutIssues = async () => {
  console.log('\n1. Verificando problemas de timeout...');
  
  // Aumentar timeout global para requisições
  axios.defaults.timeout = 30000; // 30 segundos
  
  // Verificar se o servidor está respondendo
  try {
    console.log('Testando conexão com o servidor...');
    const response = await axios.get('https://trackeone-finance-api.onrender.com/api/health');
    console.log('✅ Servidor está respondendo');
    console.log('Status:', response.data);
  } catch (error) {
    console.log('❌ Servidor não está respondendo');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    } else {
      console.log('Erro:', error.message);
    }
    
    // Tentar novamente com timeout maior
    try {
      console.log('Tentando novamente com timeout maior...');
      const response = await axios.get('https://trackeone-finance-api.onrender.com/api/health', {
        timeout: 60000 // 60 segundos
      });
      console.log('✅ Servidor respondeu na segunda tentativa');
      console.log('Status:', response.data);
    } catch (retryError) {
      console.log('❌ Servidor ainda não está respondendo');
      console.log('Erro:', retryError.message);
    }
  }
};

// Função para verificar configurações do Render
const checkRenderConfig = () => {
  console.log('\n2. Verificando configurações do Render...');
  
  // Verificar arquivo render.yaml
  try {
    const renderConfig = fs.readFileSync('./render.yaml', 'utf8');
    console.log('✅ Arquivo render.yaml encontrado');
    
    // Verificar se as configurações estão corretas
    if (renderConfig.includes('trackeone-finance-api')) {
      console.log('✅ Nome do serviço correto');
    } else {
      console.log('❌ Nome do serviço incorreto');
    }
    
    if (renderConfig.includes('node')) {
      console.log('✅ Ambiente Node.js configurado');
    } else {
      console.log('❌ Ambiente Node.js não configurado');
    }
    
    if (renderConfig.includes('DATABASE_URL')) {
      console.log('✅ DATABASE_URL configurado');
    } else {
      console.log('❌ DATABASE_URL não configurado');
    }
  } catch (error) {
    console.log('❌ Erro ao ler render.yaml:', error.message);
  }
};

// Função para verificar variáveis de ambiente
const checkEnvVariables = () => {
  console.log('\n3. Verificando variáveis de ambiente...');
  
  // Verificar .env.production
  try {
    const envProd = fs.readFileSync('./.env.production', 'utf8');
    console.log('✅ Arquivo .env.production encontrado');
    
    // Verificar variáveis essenciais
    const requiredVars = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'PORT'];
    requiredVars.forEach(varName => {
      if (envProd.includes(varName)) {
        console.log(`✅ ${varName} configurado`);
      } else {
        console.log(`❌ ${varName} não configurado`);
      }
    });
  } catch (error) {
    console.log('❌ Erro ao ler .env.production:', error.message);
  }
};

// Função para verificar estrutura do banco de dados
const checkDatabaseStructure = async () => {
  console.log('\n4. Verificando estrutura do banco de dados...');
  
  // Verificar se as tabelas essenciais existem
  const essentialTables = [
    'categories',
    'subcategories',
    'payment_status',
    'transactions',
    'users'
  ];
  
  console.log('Tabelas essenciais que devem existir:', essentialTables);
  
  // Esta verificação seria feita no servidor, então apenas simulamos
  console.log('ℹ️  Esta verificação deve ser feita no servidor de produção');
};

// Função para sugerir correções
const suggestFixes = () => {
  console.log('\n5. Sugerindo correções...');
  
  console.log('\n🔧 Correções recomendadas:');
  console.log('1. Verifique se o serviço no Render está em execução');
  console.log('2. Aumente o timeout das requisições no frontend');
  console.log('3. Adicione tratamento de erros mais robusto nas chamadas de API');
  console.log('4. Verifique as configurações de conexão com o banco de dados');
  console.log('5. Adicione retry automático para chamadas que falharem por timeout');
  console.log('6. Monitore os logs do Render para identificar problemas de inicialização');
  console.log('7. Verifique se há problemas de memória ou CPU no serviço do Render');
};

// Executar todas as verificações
const runFixes = async () => {
  await fixTimeoutIssues();
  checkRenderConfig();
  checkEnvVariables();
  await checkDatabaseStructure();
  suggestFixes();
  
  console.log('\n=== FIM DAS CORREÇÕES ===');
  console.log('🔧 Recomenda-se reiniciar o serviço no Render após aplicar as correções');
};

runFixes();