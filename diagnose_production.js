// Script para diagnosticar problemas de produção
const axios = require('axios');

// URLs de produção
const API_URL = 'https://trackeone-finance-api.onrender.com/api';
const FRONTEND_URL = 'https://ngvtech.com.br';

console.log('=== DIAGNÓSTICO DE PRODUÇÃO ===');
console.log('API URL:', API_URL);
console.log('Frontend URL:', FRONTEND_URL);

// Testar conexão com a API
const testAPI = async () => {
  try {
    console.log('\n1. Testando conexão com a API...');
    const response = await axios.get(`${API_URL}/test`, { timeout: 10000 });
    console.log('✅ API está acessível');
    console.log('Resposta:', response.data);
  } catch (error) {
    console.log('❌ Erro ao conectar com a API:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    }
  }
};

// Testar health check
const testHealth = async () => {
  try {
    console.log('\n2. Testando health check...');
    const response = await axios.get(`${API_URL}/health`, { timeout: 10000 });
    console.log('✅ Health check OK');
    console.log('Resposta:', response.data);
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    }
  }
};

// Testar categorias (sem autenticação)
const testCategoriesNoAuth = async () => {
  try {
    console.log('\n3. Testando categorias (sem autenticação)...');
    const response = await axios.get(`${API_URL}/categories`, { timeout: 10000 });
    console.log('✅ Categorias acessíveis sem autenticação');
    console.log('Total de categorias:', response.data.length);
  } catch (error) {
    console.log('ℹ️  Categorias requerem autenticação (esperado)');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Mensagem:', error.response.data.error);
    }
  }
};

// Executar diagnóstico
const runDiagnosis = async () => {
  await testAPI();
  await testHealth();
  await testCategoriesNoAuth();
  
  console.log('\n=== FIM DO DIAGNÓSTICO ===');
};

runDiagnosis();