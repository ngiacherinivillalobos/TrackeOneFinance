#!/usr/bin/env node

// Script de inicialização que garante o build antes de iniciar o servidor
const { execSync } = require('child_process');
const path = require('path');

console.log('Iniciando processo de build e start...');

try {
  // Executar o build
  console.log('Executando build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build concluído com sucesso!');
  
  // Iniciar o servidor
  console.log('Iniciando servidor...');
  require('./dist/server.js');
} catch (error) {
  console.error('Erro ao iniciar a aplicação:', error);
  process.exit(1);
}