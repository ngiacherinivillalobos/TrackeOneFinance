#!/usr/bin/env node

// Script combinado para aplicar a correção do tamanho da coluna card_number na tabela cards
// Detecta automaticamente o tipo de banco de dados e aplica a correção apropriada

const { spawn } = require('child_process');
const path = require('path');

// Carregar variáveis de ambiente do diretório raiz
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '..', '.env');
console.log('Carregando .env de:', envPath);
dotenv.config({ path: envPath });

console.log('=== Aplicando correção do tamanho da coluna card_number na tabela cards ===');

// Detectar o tipo de banco de dados
let databaseType = 'sqlite'; // padrão
let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
    // Remover o prefixo "export " se estiver presente
    if (databaseUrl.startsWith('export ')) {
        databaseUrl = databaseUrl.substring(7).trim();
        // Remover aspas se estiverem presentes
        if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
            databaseUrl = databaseUrl.substring(1, databaseUrl.length - 1);
        }
    }
    
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
        databaseType = 'postgres';
    }
}

console.log('Tipo de banco de dados detectado:', databaseType);

// Executar a correção apropriada
function runFix() {
    let scriptPath;
    
    if (databaseType === 'postgres') {
        console.log('Executando correção para PostgreSQL...');
        scriptPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_card_number_postgres.js');
    } else {
        console.log('Executando correção para SQLite...');
        scriptPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_card_number_sqlite.js');
    }
    
    // Executar o script como processo filho
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Correção aplicada com sucesso!');
            process.exit(0);
        } else {
            console.error('❌ Erro ao aplicar correção. Código de saída:', code);
            process.exit(1);
        }
    });
    
    child.on('error', (error) => {
        console.error('❌ Erro ao executar script de correção:', error.message);
        process.exit(1);
    });
}

runFix();