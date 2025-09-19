#!/usr/bin/env node

// Script para aplicar a migração da tabela de transações de cartão de crédito no PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

console.log('=== Aplicando migração da tabela de transações de cartão de crédito no PostgreSQL ===');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
    console.error('❌ Variável de ambiente DATABASE_URL não está configurada');
    console.error('Defina DATABASE_URL no formato: postgresql://user:password@host:port/database');
    process.exit(1);
}

// Criar pool de conexão
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Função para verificar se a tabela já existe
async function checkTableExists() {
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'credit_card_transactions'
            )
        `);
        return result.rows[0].exists;
    } catch (error) {
        console.error('Erro ao verificar existência da tabela:', error.message);
        throw error;
    }
}

// Função para aplicar a migração
async function applyMigration() {
    try {
        // Verificar se a tabela já existe
        const tableExists = await checkTableExists();
        
        if (tableExists) {
            console.log('✅ Tabela credit_card_transactions já existe');
            return;
        }
        
        console.log('❌ Tabela credit_card_transactions NÃO encontrada. Aplicando migração...');
        
        // Ler o script de migração
        const migrationPath = path.join(__dirname, 'create_credit_card_transactions_table.sql');
        const migrationScript = fs.readFileSync(migrationPath, 'utf8');
        
        // Dividir o script em comandos separados (por ponto-e-vírgula)
        const commands = migrationScript.split(';').filter(cmd => cmd.trim() !== '');
        
        console.log(`Executando ${commands.length} comandos de migração...`);
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (command !== '') {
                try {
                    console.log(`Executando comando ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
                    await pool.query(command);
                } catch (error) {
                    // Ignorar erros de "já existe" mas logar outros erros
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate key') &&
                        !error.message.includes('constraint')) {
                        console.error(`Erro ao executar comando ${i + 1}:`, error.message);
                        throw error;
                    } else {
                        console.log(`Comando ${i + 1} ignorado (já existe)`);
                    }
                }
            }
        }
        
        console.log('✅ Migração da tabela credit_card_transactions aplicada com sucesso!');
        
        // Verificar a estrutura da tabela criada
        console.log('\n=== Estrutura da tabela credit_card_transactions ===');
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'credit_card_transactions' 
            ORDER BY ordinal_position
        `);
        
        console.table(tableInfo.rows);
        
    } catch (error) {
        console.error('❌ Erro ao aplicar migração:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar a migração
applyMigration()
    .then(() => {
        console.log('\n✅ Script de migração concluído com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro durante a execução do script:', error.message);
        process.exit(1);
    });