#!/usr/bin/env node

// Script para aplicar especificamente a migração da tabela de transações de cartão de crédito no PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao banco de dados PostgreSQL...');
    
    // Verificar conexão
    const client = await pool.connect();
    console.log('Conexão estabelecida com sucesso!');
    
    // Ler o arquivo de migração
    const migrationPath = path.resolve(__dirname, 'database', 'migrations', 'create_credit_card_transactions_table.sql');
    console.log('Lendo arquivo de migração:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Conteúdo da migração carregado');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSql.split(';').filter(cmd => cmd.trim() !== '');
    console.log(`Encontrados ${commands.length} comandos para executar`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        console.log(`Executando comando ${i + 1}/${commands.length}:`);
        console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
        
        try {
          await client.query(command);
          console.log('✓ Comando executado com sucesso');
        } catch (error) {
          // Ignorar erros de "já existe" mas reportar outros erros
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠ Comando ignorado (já existe):', error.message);
          } else {
            console.error('✗ Erro ao executar comando:', error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se a tabela foi criada
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'credit_card_transactions'
        )
      `);
      
      if (result.rows[0].exists) {
        console.log('✅ Tabela credit_card_transactions criada com sucesso!');
        
        // Mostrar estrutura da tabela
        const tableInfo = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'credit_card_transactions'
          ORDER BY ordinal_position
        `);
        
        console.log('\nEstrutura da tabela credit_card_transactions:');
        console.table(tableInfo.rows);
      } else {
        console.log('❌ Tabela credit_card_transactions não foi criada');
      }
    } catch (error) {
      console.error('Erro ao verificar tabela:', error.message);
    }
    
    client.release();
  } catch (error) {
    console.error('Erro ao aplicar migração:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Executar a migração
applyMigration();