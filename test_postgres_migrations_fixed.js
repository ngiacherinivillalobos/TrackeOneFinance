#!/usr/bin/env node

/**
 * Script para testar as migrações corrigidas do PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// Função para verificar se um arquivo contém IF NOT EXISTS fora de blocos DO $$
function containsIfNotExists(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Verificar se contém IF NOT EXISTS fora de comentários e blocos DO $$
    const lines = content.split('\n');
    let inDoBlock = false;
    
    for (const line of lines) {
      // Verificar início e fim de blocos DO $$
      if (line.includes('DO $$')) {
        inDoBlock = true;
        continue;
      }
      if (line.includes('END $$')) {
        inDoBlock = false;
        continue;
      }
      
      // Ignorar linhas de comentário e linhas dentro de blocos DO $$
      if (!line.trim().startsWith('--') && !line.trim().startsWith('/*') && !inDoBlock) {
        if (line.includes('IF NOT EXISTS') || 
            line.includes('ADD CONSTRAINT IF NOT EXISTS') || 
            line.includes('CREATE INDEX IF NOT EXISTS') ||
            line.includes('CREATE TABLE IF NOT EXISTS')) {
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

// Função para verificar se um arquivo usa blocos DO $$
function containsDoBlocks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('DO $$') && content.includes('END $$');
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

let hasIssues = false;

postgresMigrations.forEach(file => {
  console.log(`📄 Verificando: ${path.basename(file)}`);
  
  // Verificar se contém IF NOT EXISTS (problema)
  const hasIfNotExists = containsIfNotExists(file);
  if (hasIfNotExists) {
    console.log(`   ❌ Contém IF NOT EXISTS fora de blocos DO $$ (incompatível com Render)`);
    hasIssues = true;
  } else {
    console.log(`   ✅ Não contém IF NOT EXISTS fora de blocos DO $$`);
  }
  
  // Verificar se usa blocos DO $$ (correto)
  const hasDoBlocks = containsDoBlocks(file);
  if (hasDoBlocks) {
    console.log(`   ✅ Usa blocos DO $$ (compatível com Render)`);
  } else {
    console.log(`   ⚠️  Não usa blocos DO $$ (pode não ser necessário)`);
  }
  
  console.log('');
});

if (hasIssues) {
  console.log('❌ Foram encontrados problemas nas migrações!');
  console.log('   Corrija os arquivos que contêm IF NOT EXISTS fora de blocos DO $$.');
} else {
  console.log('✅ Todas as migrações do PostgreSQL estão corretas!');
  console.log('   Nenhum problema encontrado com IF NOT EXISTS fora de blocos DO $$.');
}

console.log('\n📊 Resumo:');
console.log(`   Total de migrações verificadas: ${postgresMigrations.length}`);