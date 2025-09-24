#!/usr/bin/env node

/**
 * Script para limpar usuários de teste do banco de dados
 */

const axios = require('axios');

async function cleanupTestUser() {
  console.log('🧹 Limpando usuários de teste...\n');
  
  try {
    // Este script é apenas para demonstração
    // Em um ambiente real, você precisaria de permissões de administrador
    // para remover usuários de teste
    
    console.log('ℹ️  Em um ambiente de produção real, você precisaria:');
    console.log('   1. Acessar o banco de dados diretamente');
    console.log('   2. Executar uma query para remover usuários de teste');
    console.log('   3. Ou usar uma API de administração com autenticação adequada');
    
    console.log('\n✅ Processo de limpeza simulado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar usuários de teste:', error.message);
  }
}

// Executar limpeza
cleanupTestUser();