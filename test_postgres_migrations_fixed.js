#!/usr/bin/env node

/**
 * Script para testar as migrações corrigidas do PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// Função para verificar se um arquivo contém blocos DO $$
function containsDoBlocks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('DO $$') && content.includes('END $$');
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error.message);
    return false;
  }
}

// Função para verificar se um arquivo contém IF NOT EXISTS fora de comentários
function containsIfNotExists(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Ignorar linhas de comentário
      if (!line.trim().startsWith('--') && !line.trim().startsWith('/*')) {
        if (line.includes('IF NOT EXISTS')) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error.message);
    return false;
  }
}

// Diretório de migrações
const migrationsDir = path.join(__dirname, 'database', 'migrations');

// Listar todos os arquivos de migração do PostgreSQL
const postgresMigrations = fs.readdirSync(migrationsDir)
  .filter(file => file.includes('postgres') || file.includes('postgre') || file.includes('Postgre'))
  .map(file => path.join(migrationsDir, file));

console.log('🔍 Verificando migrações do PostgreSQL...\n');

let hasDoBlocks = false;
let hasIfNotExists = false;

postgresMigrations.forEach(file => {
  console.log(`📄 Verificando: ${path.basename(file)}`);
  
  // Verificar se contém blocos DO $$ (problema)
  const hasBlocks = containsDoBlocks(file);
  if (hasBlocks) {
    console.log(`   ❌ Contém blocos DO $$ (incompatível com Render)`);
    hasDoBlocks = true;
  } else {
    console.log(`   ✅ Não contém blocos DO $$`);
  }
  
  // Verificar se contém IF NOT EXISTS (aceitável)
  const hasIfExists = containsIfNotExists(file);
  if (hasIfExists) {
    console.log(`   ⚠️  Contém IF NOT EXISTS (aceitável)`);
    hasIfNotExists = true;
  } else {
    console.log(`   ✅ Não contém IF NOT EXISTS`);
  }
  
  console.log('');
});

if (hasDoBlocks) {
  console.log('❌ Foram encontrados problemas nas migrações!');
  console.log('   Corrija os arquivos que contêm blocos DO $$ para usar IF NOT EXISTS diretamente.');
} else {
  console.log('✅ Todas as migrações do PostgreSQL estão corretas!');
  console.log('   Nenhum problema encontrado com blocos DO $$.');
  
  if (hasIfNotExists) {
    console.log('   ⚠️  Alguns arquivos contêm IF NOT EXISTS, o que é aceitável.');
  }
}

console.log('\n📊 Resumo:');
console.log(`   Total de migrações verificadas: ${postgresMigrations.length}`);