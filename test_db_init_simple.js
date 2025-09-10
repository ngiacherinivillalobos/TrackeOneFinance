// Script simplificado para testar a inicialização do banco de dados
const path = require('path');

// Configurar o caminho correto para os módulos
const serverPath = path.resolve(__dirname, 'server');
console.log('Server path:', serverPath);

// Tentar carregar dotenv
try {
  console.log('\nTentando carregar dotenv...');
  require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
  console.log('✅ Dotenv carregado com sucesso');
  console.log('NODE_ENV:', process.env.NODE_ENV);
} catch (error) {
  console.error('❌ Erro ao carregar dotenv:', error.message);
}

// Tentar carregar o módulo de conexão com o caminho correto
try {
  console.log('\nTentando carregar módulo de conexão...');
  const connectionModule = require('./server/src/database/connection');
  console.log('✅ Módulo de conexão carregado com sucesso');
  console.log('Funções disponíveis:', Object.keys(connectionModule));
} catch (error) {
  console.error('❌ Erro ao carregar módulo de conexão:', error.message);
  console.error('Stack:', error.stack);
}