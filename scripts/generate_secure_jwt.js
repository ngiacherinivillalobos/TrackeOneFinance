#!/usr/bin/env node

/**
 * Script para gerar uma chave secreta JWT segura para produção
 */

const crypto = require('crypto');

// Gerar uma chave secreta segura
const generateSecureJWTSecret = () => {
  // Gerar 64 bytes (512 bits) de dados aleatórios
  const secret = crypto.randomBytes(64).toString('hex');
  return secret;
};

// Gerar e exibir a chave secreta
const jwtSecret = generateSecureJWTSecret();

console.log('🔐 Chave secreta JWT gerada para produção:');
console.log('');
console.log(jwtSecret);
console.log('');
console.log('📋 Instruções de uso:');
console.log('1. Copie esta chave secreta');
console.log('2. No Render, adicione como variável de ambiente:');
console.log('   JWT_SECRET=chave_gerada_aqui');
console.log('3. Guarde esta chave em local seguro para futuras referências');
console.log('');
console.log('⚠️  Atenção: Esta chave só será exibida uma vez. Certifique-se de copiá-la antes de fechar esta janela.');