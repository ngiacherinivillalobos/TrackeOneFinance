// Script para simular o ambiente de produção
const path = require('path');

console.log('=== SIMULAÇÃO DO AMBIENTE DE PRODUÇÃO ===\n');

// Configurar variáveis de ambiente de produção
process.env.NODE_ENV = 'production';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'; // URL de teste

console.log('Variáveis de ambiente configuradas:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADA' : 'NÃO CONFIGURADA');

// Mudar para o diretório do servidor
try {
  process.chdir(path.resolve(__dirname, 'server'));
  console.log('\nDiretório atual:', process.cwd());
  
  // Tentar carregar o módulo de conexão
  console.log('\n1. Tentando carregar módulo de conexão...');
  const connectionModule = require('./dist/database/connection.js');
  console.log('   ✅ Módulo de conexão carregado com sucesso');
  
  // Tentar carregar o módulo de migrações
  console.log('\n2. Tentando carregar módulo de migrações...');
  const migrationsModule = require('./dist/database/migrations/index.js');
  console.log('   ✅ Módulo de migrações carregado com sucesso');
  
  // Tentar carregar o servidor
  console.log('\n3. Tentando carregar servidor...');
  const serverModule = require('./dist/server.js');
  console.log('   ✅ Servidor carregado com sucesso');
  
} catch (error) {
  console.error('\n❌ Erro ao carregar módulos:', error.message);
  console.error('   Stack:', error.stack);
}

console.log('\n=== FIM DA SIMULAÇÃO ===');