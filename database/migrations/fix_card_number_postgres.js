#!/usr/bin/env node

// Script para aplicar a correção do tamanho da coluna card_number na tabela cards no PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do diretório raiz
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '..', '..', '.env');
console.log('Carregando .env de:', envPath);
dotenv.config({ path: envPath });

console.log('=== Aplicando correção do tamanho da coluna card_number na tabela cards ===');

// Verificar se DATABASE_URL está configurada
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.POSTGRES_URL) {
    databaseUrl = process.env.POSTGRES_URL;
}

console.log('DATABASE_URL carregada:', databaseUrl ? 'Sim' : 'Não');
console.log('POSTGRES_URL carregada:', process.env.POSTGRES_URL ? 'Sim' : 'Não');

if (!databaseUrl) {
    console.error('❌ Variável de ambiente DATABASE_URL não está configurada');
    console.error('Defina DATABASE_URL no formato: postgresql://user:password@host:port/database');
    process.exit(1);
}

// Remover o prefixo "export " se estiver presente
if (databaseUrl.startsWith('export ')) {
    databaseUrl = databaseUrl.substring(7).trim();
    // Remover aspas se estiverem presentes
    if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
        databaseUrl = databaseUrl.substring(1, databaseUrl.length - 1);
    }
}

console.log('Usando DATABASE_URL:', databaseUrl.substring(0, 30) + '...');

// Criar pool de conexão
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: false // Desativar SSL para ambiente local
});

// Função para aplicar a correção
async function applyFix() {
    try {
        // Ler o script de correção
        const fixPath = path.join(__dirname, 'fix_card_number_length_postgres.sql');
        const fixScript = fs.readFileSync(fixPath, 'utf8');
        
        // Dividir o script em comandos separados (por ponto-e-vírgula)
        const commands = fixScript.split(';').filter(cmd => cmd.trim() !== '');
        
        console.log(`Executando ${commands.length} comandos de correção...`);
        
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
                        console.log(`Comando ${i + 1} ignorado (já existe ou não aplicável)`);
                    }
                }
            }
        }
        
        console.log('✅ Correção do tamanho da coluna card_number aplicada com sucesso!');
        
        // Verificar a estrutura da coluna corrigida
        console.log('\n=== Estrutura da coluna card_number na tabela cards ===');
        const columnInfo = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'cards' AND column_name = 'card_number'
        `);
        
        if (columnInfo.rows.length > 0) {
            console.table(columnInfo.rows);
        } else {
            console.log('Coluna card_number não encontrada na tabela cards');
        }
        
    } catch (error) {
        console.error('❌ Erro ao aplicar correção:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar a correção
applyFix()
    .then(() => {
        console.log('\n✅ Script de correção concluído com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro durante a execução do script:', error.message);
        process.exit(1);
    });