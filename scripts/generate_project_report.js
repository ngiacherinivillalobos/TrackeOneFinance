#!/usr/bin/env node

/**
 * Script para gerar um relatório completo do status do projeto TrackeOne Finance
 * Inclui informações sobre versões, dependências, estrutura e configurações
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para executar comandos e obter output
const runCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return `Erro ao executar: ${command}`;
  }
};

// Função para ler arquivo JSON
const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

// Função para verificar existência de arquivos
const checkFileExists = (filePath) => {
  return fs.existsSync(path.resolve(filePath));
};

// Função para formatar data
const formatDate = () => {
  return new Date().toLocaleString('pt-BR');
};

// Função principal para gerar relatório
const generateProjectReport = () => {
  console.log(`📋 RELATÓRIO COMPLETO DO PROJETO TRACKONE FINANCE`);
  console.log(`📅 Gerado em: ${formatDate()}`);
  console.log(`📍 Diretório: ${process.cwd()}`);
  console.log('=' .repeat(80));
  
  // 1. Informações do Sistema
  console.log('\n🖥️  INFORMAÇÕES DO SISTEMA');
  console.log('-' .repeat(40));
  console.log(`Sistema Operacional: ${runCommand('uname -s')} ${runCommand('uname -r')}`);
  console.log(`Node.js: ${runCommand('node --version')}`);
  console.log(`npm: ${runCommand('npm --version')}`);
  
  // 2. Estrutura do Projeto
  console.log('\n📂 ESTRUTURA DO PROJETO');
  console.log('-' .repeat(40));
  const directories = ['client', 'server', 'database', 'scripts'];
  directories.forEach(dir => {
    const exists = checkFileExists(dir) ? '✅' : '❌';
    console.log(`${exists} ${dir}/`);
  });
  
  // 3. Package.json Principal
  console.log('\n📦 PACKAGE.JSON RAIZ');
  console.log('-' .repeat(40));
  const rootPackage = readJsonFile('package.json');
  if (rootPackage) {
    console.log(`Nome: ${rootPackage.name}`);
    console.log(`Versão: ${rootPackage.version}`);
    console.log(`Descrição: ${rootPackage.description}`);
    console.log('Scripts disponíveis:');
    Object.keys(rootPackage.scripts || {}).forEach(script => {
      console.log(`  - ${script}: ${rootPackage.scripts[script]}`);
    });
  } else {
    console.log('❌ Não encontrado');
  }
  
  // 4. Package.json do Cliente
  console.log('\n🌐 PACKAGE.JSON DO CLIENTE');
  console.log('-' .repeat(40));
  const clientPackage = readJsonFile('client/package.json');
  if (clientPackage) {
    console.log(`Nome: ${clientPackage.name}`);
    console.log(`Versão: ${clientPackage.version}`);
    console.log(`React: ${clientPackage.dependencies?.react}`);
    console.log(`MUI: ${clientPackage.dependencies?.['@mui/material']}`);
    console.log(`Vite: ${clientPackage.devDependencies?.vite}`);
  } else {
    console.log('❌ Não encontrado');
  }
  
  // 5. Package.json do Servidor
  console.log('\n⚙️  PACKAGE.JSON DO SERVIDOR');
  console.log('-' .repeat(40));
  const serverPackage = readJsonFile('server/package.json');
  if (serverPackage) {
    console.log(`Nome: ${serverPackage.name}`);
    console.log(`Versão: ${serverPackage.version}`);
    console.log(`Express: ${serverPackage.dependencies?.express}`);
    console.log(`TypeScript: ${serverPackage.dependencies?.typescript}`);
    console.log(`PostgreSQL: ${serverPackage.dependencies?.pg}`);
  } else {
    console.log('❌ Não encontrado');
  }
  
  // 6. Arquivos de Configuração
  console.log('\n⚙️  ARQUIVOS DE CONFIGURAÇÃO');
  console.log('-' .repeat(40));
  const configFiles = [
    { name: 'Render YAML', path: 'render.yaml' },
    { name: 'Gitignore', path: '.gitignore' },
    { name: 'Client .env', path: 'client/.env' },
    { name: 'Server .env', path: 'server/.env' }
  ];
  
  configFiles.forEach(file => {
    const exists = checkFileExists(file.path) ? '✅' : '❌';
    console.log(`${exists} ${file.name} (${file.path})`);
  });
  
  // 7. Banco de Dados
  console.log('\n🗄️  BANCO DE DADOS');
  console.log('-' .repeat(40));
  const dbFiles = [
    { name: 'Schema SQLite', path: 'database/initial.sql' },
    { name: 'Schema PostgreSQL', path: 'database/initial_postgres.sql' },
    { name: 'Banco de Dados', path: 'database/track_one_finance.db' }
  ];
  
  dbFiles.forEach(file => {
    const exists = checkFileExists(file.path) ? '✅' : '❌';
    console.log(`${exists} ${file.name}`);
  });
  
  // 8. Migrações
  console.log('\n🔄 MIGRAÇÕES');
  console.log('-' .repeat(40));
  if (checkFileExists('database/migrations')) {
    const migrations = fs.readdirSync(path.resolve('database/migrations'))
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Total de migrações: ${migrations.length}`);
    migrations.forEach(migration => {
      console.log(`  - ${migration}`);
    });
  } else {
    console.log('❌ Diretório de migrações não encontrado');
  }
  
  // 9. Documentação
  console.log('\n📚 DOCUMENTAÇÃO');
  console.log('-' .repeat(40));
  const docs = [
    'README.md',
    'DEPLOY_INSTRUCTIONS.md',
    'DEPLOY_RENDER_GUIA.md',
    'DEPLOY_VERCEL_GUIA.md',
    'DEPLOY_COMPLETO_GUIA.md',
    'TROUBLESHOOTING_DEPLOY.md',
    'MIGRATION_GUIDE.md'
  ];
  
  docs.forEach(doc => {
    const exists = checkFileExists(doc) ? '✅' : '❌';
    console.log(`${exists} ${doc}`);
  });
  
  // 10. Scripts Personalizados
  console.log('\n🔧 SCRIPTS PERSONALIZADOS');
  console.log('-' .repeat(40));
  if (checkFileExists('scripts')) {
    const scripts = fs.readdirSync(path.resolve('scripts'))
      .filter(file => file.endsWith('.js') || file.endsWith('.sh'))
      .sort();
    
    console.log(`Total de scripts: ${scripts.length}`);
    scripts.forEach(script => {
      console.log(`  - ${script}`);
    });
  } else {
    console.log('❌ Diretório de scripts não encontrado');
  }
  
  // 11. Status do Git
  console.log('\n🔍 STATUS DO GIT');
  console.log('-' .repeat(40));
  console.log(runCommand('git status --porcelain') || '✅ Nenhuma alteração pendente');
  
  // 12. Branch atual
  console.log('\n🌿 BRANCH ATUAL');
  console.log('-' .repeat(40));
  console.log(runCommand('git branch --show-current'));
  
  // 13. Último commit
  console.log('\n📝 ÚLTIMO COMMIT');
  console.log('-' .repeat(40));
  console.log(runCommand('git log -1 --oneline'));
  
  console.log('\n' + '=' .repeat(80));
  console.log('✅ Relatório gerado com sucesso!');
  console.log('📄 Este relatório pode ser usado para diagnóstico de problemas ou auditoria do projeto.');
};

// Executar relatório
if (require.main === module) {
  generateProjectReport();
}

module.exports = { generateProjectReport };