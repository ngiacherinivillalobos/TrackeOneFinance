// Script para verificar possíveis problemas no código do backend
const fs = require('fs');
const path = require('path');

console.log('=== VERIFICAÇÃO DE PROBLEMAS NO BACKEND ===\n');

// 1. Verificar package.json
console.log('1. Verificando package.json...');
const packageJson = JSON.parse(fs.readFileSync('./server/package.json', 'utf8'));
console.log('  - Scripts:', Object.keys(packageJson.scripts));
console.log('  - Dependências:', Object.keys(packageJson.dependencies));

// 2. Verificar arquivos de configuração
console.log('\n2. Verificando arquivos de configuração...');
const configFiles = [
  './server/render.yaml',
  './server/.env'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  - ${file}: OK`);
  } else {
    console.log(`  - ${file}: NÃO ENCONTRADO`);
  }
});

// 3. Verificar estrutura de diretórios
console.log('\n3. Verificando estrutura de diretórios...');
const requiredDirs = [
  './server/src',
  './server/src/controllers',
  './server/src/routes',
  './server/src/database'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  - ${dir}: OK`);
  } else {
    console.log(`  - ${dir}: NÃO ENCONTRADO`);
  }
});

// 4. Verificar arquivos principais
console.log('\n4. Verificando arquivos principais...');
const mainFiles = [
  './server/src/server.ts',
  './server/src/database/connection.ts',
  './server/src/database/migrations/index.ts'
];

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  - ${file}: OK`);
  } else {
    console.log(`  - ${file}: NÃO ENCONTRADO`);
  }
});

// 5. Verificar imports no server.ts
console.log('\n5. Verificando imports no server.ts...');
const serverContent = fs.readFileSync('./server/src/server.ts', 'utf8');
const importLines = serverContent.split('\n').filter(line => line.includes('import'));
console.log('  - Imports encontrados:', importLines.length);

// 6. Verificar variáveis de ambiente
console.log('\n6. Verificando variáveis de ambiente...');
const envContent = fs.readFileSync('./server/.env', 'utf8');
const envVars = envContent.split('\n').filter(line => line.includes('=') && !line.startsWith('#'));
console.log('  - Variáveis definidas:', envVars.length);

// 7. Verificar porta
console.log('\n7. Verificando configuração de porta...');
const portMatch = envContent.match(/PORT=(\d+)/);
if (portMatch) {
  console.log(`  - Porta configurada: ${portMatch[1]}`);
} else {
  console.log('  - Porta não encontrada no .env');
}

// 8. Verificar NODE_ENV
console.log('\n8. Verificando NODE_ENV...');
const nodeEnvMatch = envContent.match(/NODE_ENV=(\w+)/);
if (nodeEnvMatch) {
  console.log(`  - NODE_ENV: ${nodeEnvMatch[1]}`);
} else {
  console.log('  - NODE_ENV não encontrado no .env');
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');