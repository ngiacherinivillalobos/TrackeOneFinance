const fs = require('fs');
const path = require('path');

// Função para verificar se um arquivo .env existe e tem conteúdo
function checkEnvFile(filePath, requiredVars = []) {
  console.log(`\nVerificando arquivo: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Arquivo não encontrado');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('✅ Arquivo encontrado');
  
  if (content.trim() === '') {
    console.log('⚠️  Arquivo está vazio');
    return false;
  }
  
  console.log('✅ Arquivo tem conteúdo');
  
  // Verificar variáveis obrigatórias
  for (const varName of requiredVars) {
    if (!content.includes(varName)) {
      console.log(`⚠️  Variável obrigatória não encontrada: ${varName}`);
    } else {
      console.log(`✅ Variável encontrada: ${varName}`);
    }
  }
  
  return true;
}

// Função para verificar a configuração geral
function checkConfiguration() {
  console.log('=== Verificação de Configuração do Ambiente ===');
  
  // Verificar .env do servidor
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const serverRequiredVars = ['JWT_SECRET', 'PORT', 'NODE_ENV'];
  const serverEnvOk = checkEnvFile(serverEnvPath, serverRequiredVars);
  
  // Verificar .env do cliente
  const clientEnvPath = path.join(__dirname, 'client', '.env');
  const clientRequiredVars = ['VITE_API_URL'];
  const clientEnvOk = checkEnvFile(clientEnvPath, clientRequiredVars);
  
  // Verificar package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  console.log(`\nVerificando arquivo: ${packageJsonPath}`);
  if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json encontrado');
  } else {
    console.log('❌ package.json não encontrado');
  }
  
  // Verificar diretórios
  const requiredDirs = ['server', 'client', 'database'];
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    console.log(`\nVerificando diretório: ${dirPath}`);
    if (fs.existsSync(dirPath)) {
      console.log('✅ Diretório encontrado');
    } else {
      console.log('❌ Diretório não encontrado');
    }
  }
  
  // Resumo
  console.log('\n=== Resumo ===');
  console.log(`.env do servidor: ${serverEnvOk ? '✅ OK' : '❌ Problemas'}`);
  console.log(`.env do cliente: ${clientEnvOk ? '✅ OK' : '❌ Problemas'}`);
  
  if (serverEnvOk && clientEnvOk) {
    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('Você pode agora executar "npm run dev" para iniciar a aplicação.');
  } else {
    console.log('\n⚠️  Existem problemas na configuração.');
    console.log('Por favor, verifique os arquivos .env e siga as instruções no README.md.');
  }
}

// Executar verificação
checkConfiguration();