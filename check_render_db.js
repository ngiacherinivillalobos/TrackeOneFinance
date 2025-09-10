// Script para verificar a configuração do banco de dados do Render
const fs = require('fs');
const path = require('path');

console.log('=== VERIFICAÇÃO DA CONFIGURAÇÃO DO BANCO DE DADOS DO RENDER ===\n');

// Verificar se o arquivo de configuração do Render existe
const renderYamlPath = path.resolve(__dirname, 'server', 'render.yaml');
console.log('1. Verificando arquivo de configuração do Render...');
if (fs.existsSync(renderYamlPath)) {
  console.log('  ✅ render.yaml encontrado');
  const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
  console.log('  Conteúdo do render.yaml:');
  console.log(renderYaml);
} else {
  console.log('  ❌ render.yaml não encontrado');
}

// Verificar variáveis de ambiente do Render
console.log('\n2. Verificando variáveis de ambiente do Render...');
const requiredEnvVars = ['NODE_ENV', 'JWT_SECRET', 'DATABASE_URL', 'PORT'];
console.log('  Variáveis de ambiente necessárias:', requiredEnvVars);

// Verificar se há um arquivo .env de exemplo
const envExamplePath = path.resolve(__dirname, 'server', '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('  ✅ .env.example encontrado');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  console.log('  Conteúdo do .env.example:');
  console.log(envExample);
} else {
  console.log('  ⚠️  .env.example não encontrado');
}

// Verificar o arquivo .env atual
const envPath = path.resolve(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  console.log('\n3. Verificando arquivo .env atual...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('  Conteúdo do .env:');
  console.log(envContent);
} else {
  console.log('\n3. ⚠️  .env não encontrado');
}

// Verificar arquivos de migração do PostgreSQL
console.log('\n4. Verificando arquivos de migração do PostgreSQL...');
const migrationsDir = path.resolve(__dirname, 'database', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const postgresMigrations = fs.readdirSync(migrationsDir)
    .filter(file => file.includes('_postgres.sql'))
    .sort();
  
  console.log(`  ✅ Encontradas ${postgresMigrations.length} migrações para PostgreSQL:`);
  postgresMigrations.forEach(file => {
    console.log(`    - ${file}`);
  });
} else {
  console.log('  ❌ Diretório de migrações não encontrado');
}

// Verificar arquivo de inicialização do PostgreSQL
console.log('\n5. Verificando arquivo de inicialização do PostgreSQL...');
const initPostgresPath = path.resolve(__dirname, 'database', 'init_postgresql.sql');
if (fs.existsSync(initPostgresPath)) {
  console.log('  ✅ init_postgresql.sql encontrado');
  const initPostgresContent = fs.readFileSync(initPostgresPath, 'utf8');
  console.log('  Tamanho do arquivo:', initPostgresContent.length, 'caracteres');
} else {
  console.log('  ❌ init_postgresql.sql não encontrado');
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');