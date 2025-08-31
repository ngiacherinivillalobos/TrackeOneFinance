const crypto = require('crypto');

// Função para gerar uma chave secreta segura para JWT
function generateJWTSecret() {
  // Gerar uma string aleatória segura de 64 caracteres
  const secret = crypto.randomBytes(32).toString('hex');
  return secret;
}

// Função para gerar uma chave secreta mais simples (para desenvolvimento)
function generateSimpleJWTSecret() {
  const prefix = 'trackeone_finance_secret_key_';
  const timestamp = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}_${random}`;
}

// Gerar e exibir as chaves secretas
console.log('=== JWT Secret Key Generator ===\n');

console.log('Chave secreta segura para produção:');
console.log(generateJWTSecret());
console.log();

console.log('Chave secreta simples para desenvolvimento:');
console.log(generateSimpleJWTSecret());
console.log();

console.log('Instruções:');
console.log('1. Para desenvolvimento, use a chave simples no arquivo server/.env');
console.log('2. Para produção, use a chave segura nas variáveis de ambiente do Render');
console.log('3. Nunca commite chaves secretas em repositórios públicos!');