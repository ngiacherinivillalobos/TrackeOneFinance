// Script para testar a inicialização completa do servidor
const path = require('path');

console.log('=== TESTE DE INICIALIZAÇÃO COMPLETA DO SERVIDOR ===\n');

// Configurar o ambiente
process.env.NODE_ENV = 'production';
process.env.PORT = '3001';

console.log('Ambiente configurado:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);

// Tentar carregar e executar o servidor
try {
  console.log('\n1. Tentando carregar o servidor...');
  
  // Mudar para o diretório do servidor
  process.chdir(path.resolve(__dirname, 'server'));
  console.log('  Diretório atual:', process.cwd());
  
  // Carregar o módulo do servidor
  const serverModule = require('./dist/server.js');
  console.log('  ✅ Servidor carregado com sucesso');
  
} catch (error) {
  console.error('  ❌ Erro ao carregar o servidor:', error.message);
  console.error('  Stack:', error.stack);
}

console.log('\n=== FIM DO TESTE ===');