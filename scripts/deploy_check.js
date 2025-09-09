#!/usr/bin/env node

/**
 * Script de verificação pré-deploy para TrackeOne Finance
 * Este script verifica se todas as configurações necessárias estão prontas para o deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Função para imprimir mensagens coloridas
const printMessage = (message, color = colors.reset, prefix = '') => {
  console.log(`${prefix}${color}${message}${colors.reset}`);
};

// Função para verificar existência de arquivos
const checkFileExists = (filePath, description) => {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    printMessage(`✓ ${description} encontrado`, colors.green);
    return true;
  } else {
    printMessage(`✗ ${description} não encontrado`, colors.red);
    return false;
  }
};

// Função para verificar conteúdo de arquivos
const checkFileContent = (filePath, pattern, description) => {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    if (pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern)) {
      printMessage(`✓ ${description}`, colors.green);
      return true;
    } else {
      printMessage(`✗ ${description}`, colors.red);
      return false;
    }
  } catch (error) {
    printMessage(`✗ Erro ao ler ${description}: ${error.message}`, colors.red);
    return false;
  }
};

// Função para executar comandos
const runCommand = (command, description) => {
  try {
    printMessage(`Executando: ${description}`, colors.blue);
    execSync(command, { stdio: 'pipe' });
    printMessage(`✓ ${description} concluído com sucesso`, colors.green);
    return true;
  } catch (error) {
    printMessage(`✗ Erro em ${description}: ${error.message}`, colors.red);
    return false;
  }
};

// Função principal de verificação
const runDeployCheck = () => {
  printMessage('=== Verificação Pré-Deploy do TrackeOne Finance ===', colors.blue);
  printMessage('');

  let allChecksPassed = true;

  // 1. Verificar estrutura de diretórios
  printMessage('1. Verificando estrutura de diretórios...', colors.blue);
  const directories = [
    { path: '.', description: 'Diretório raiz do projeto' },
    { path: 'client', description: 'Diretório do cliente (frontend)' },
    { path: 'server', description: 'Diretório do servidor (backend)' },
    { path: 'database', description: 'Diretório de banco de dados' }
  ];

  directories.forEach(dir => {
    if (!checkFileExists(dir.path, dir.description)) {
      allChecksPassed = false;
    }
  });
  printMessage('');

  // 2. Verificar arquivos de configuração principais
  printMessage('2. Verificando arquivos de configuração...', colors.blue);
  const configFiles = [
    { path: 'package.json', description: 'Package.json raiz' },
    { path: 'client/package.json', description: 'Package.json do cliente' },
    { path: 'server/package.json', description: 'Package.json do servidor' },
    { path: 'render.yaml', description: 'Arquivo de configuração do Render' },
    { path: 'database/initial.sql', description: 'Schema do banco de dados (SQLite)' },
    { path: 'database/initial_postgres.sql', description: 'Schema do banco de dados (PostgreSQL)' }
  ];

  configFiles.forEach(file => {
    if (!checkFileExists(file.path, file.description)) {
      allChecksPassed = false;
    }
  });
  printMessage('');

  // 3. Verificar conteúdo dos package.json
  printMessage('3. Verificando conteúdo dos package.json...', colors.blue);
  const packageChecks = [
    {
      file: 'server/package.json',
      pattern: '"start": "node dist/server.js"',
      description: 'Script de start no servidor'
    },
    {
      file: 'server/package.json',
      pattern: '"build": "tsc"',
      description: 'Script de build no servidor'
    },
    {
      file: 'client/package.json',
      pattern: '"build": "tsc && vite build"',
      description: 'Script de build no cliente'
    }
  ];

  packageChecks.forEach(check => {
    if (!checkFileContent(check.file, check.pattern, check.description)) {
      allChecksPassed = false;
    }
  });
  printMessage('');

  // 4. Verificar arquivos de migração
  printMessage('4. Verificando arquivos de migração...', colors.blue);
  if (checkFileExists('server/src/database/migrations/index.ts', 'Sistema de migrações')) {
    const migrationFiles = [
      'add_cash_flow_table.sql',
      'add_cost_center_to_cash_flow.sql',
      'add_cost_center_to_users.sql',
      'add_installment_fields.sql',
      'add_investment_type.sql'
    ];

    migrationFiles.forEach(file => {
      if (!checkFileExists(`database/migrations/${file}`, `Migração: ${file}`)) {
        allChecksPassed = false;
      }
    });
  } else {
    allChecksPassed = false;
  }
  printMessage('');

  // 5. Verificar arquivos de deploy
  printMessage('5. Verificando arquivos de documentação de deploy...', colors.blue);
  const deployDocs = [
    'DEPLOY_INSTRUCTIONS.md',
    'DEPLOY_RENDER_GUIA.md',
    'DEPLOY_VERCEL_GUIA.md',
    'GUIA_HOSPEDAGEM_PRODUCAO.md'
  ];

  deployDocs.forEach(doc => {
    if (!checkFileExists(doc, `Documentação de deploy: ${doc}`)) {
      allChecksPassed = false;
    }
  });
  printMessage('');

  // 6. Verificar dependências instaladas
  printMessage('6. Verificando dependências...', colors.blue);
  try {
    // Verificar dependências do servidor
    if (fs.existsSync('server/node_modules')) {
      printMessage('✓ Dependências do servidor instaladas', colors.green);
    } else {
      printMessage('ℹ Dependências do servidor não instaladas (serão instaladas durante o deploy)', colors.yellow);
    }

    // Verificar dependências do cliente
    if (fs.existsSync('client/node_modules')) {
      printMessage('✓ Dependências do cliente instaladas', colors.green);
    } else {
      printMessage('ℹ Dependências do cliente não instaladas (serão instaladas durante o deploy)', colors.yellow);
    }
  } catch (error) {
    printMessage(`✗ Erro ao verificar dependências: ${error.message}`, colors.red);
    allChecksPassed = false;
  }
  printMessage('');

  // 7. Verificar build do projeto
  printMessage('7. Verificando build do projeto...', colors.blue);
  printMessage('ℹ Nota: Esta verificação pode levar alguns minutos', colors.yellow);
  
  // Verificar build do servidor
  try {
    execSync('cd server && npm run build', { stdio: 'pipe' });
    printMessage('✓ Build do servidor concluído com sucesso', colors.green);
  } catch (error) {
    printMessage('✗ Erro no build do servidor', colors.red);
    allChecksPassed = false;
  }

  // Verificar build do cliente
  try {
    execSync('cd client && npm run build', { stdio: 'pipe' });
    printMessage('✓ Build do cliente concluído com sucesso', colors.green);
  } catch (error) {
    printMessage('✗ Erro no build do cliente', colors.red);
    allChecksPassed = false;
  }
  printMessage('');

  // Resultado final
  printMessage('=== Resultado da Verificação ===', colors.blue);
  if (allChecksPassed) {
    printMessage('✅ Todos os checks passaram! O projeto está pronto para deploy.', colors.green);
    printMessage('');
    printMessage('Próximos passos:', colors.blue);
    printMessage('1. Faça commit e push das suas alterações:', colors.yellow);
    printMessage('   git add .', colors.yellow);
    printMessage('   git commit -m "Preparação para deploy"', colors.yellow);
    printMessage('   git push origin main', colors.yellow);
    printMessage('2. Siga o guia completo em DEPLOY_COMPLETO_GUIA.md', colors.yellow);
    printMessage('3. Deploy no Render (backend) e Vercel (frontend)', colors.yellow);
  } else {
    printMessage('❌ Alguns checks falharam. Por favor, corrija os problemas antes de fazer o deploy.', colors.red);
    printMessage('Verifique as mensagens de erro acima e consulte a documentação.', colors.yellow);
  }

  return allChecksPassed;
};

// Executar verificação
if (require.main === module) {
  const result = runDeployCheck();
  process.exit(result ? 0 : 1);
}

module.exports = { runDeployCheck };