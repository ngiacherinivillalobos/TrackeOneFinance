#!/usr/bin/env node

/**
 * CORREÇÃO IMEDIATA - Fix Card Number Length em Produção
 * Este script corrige o problema de limite de caracteres no campo card_number
 */

const { Pool } = require('pg');
require('dotenv').config();

async function fixCardNumberLength() {
    console.log('🔧 CORREÇÃO IMEDIATA - Fix Card Number Length em Produção');
    console.log('================================================================');
    
    // URL de produção do PostgreSQL no Render
    const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_PRODUCTION;
    
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente');
        console.log('📋 Configure a variável DATABASE_URL com a URL do banco PostgreSQL de produção');
        process.exit(1);
    }
    
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') ? false : {
            rejectUnauthorized: false
        }
    });
    
    try {
        console.log('🔗 Conectando ao banco de dados de produção...');
        
        // Verificar estrutura atual
        console.log('🔍 Verificando estrutura atual da tabela cards...');
        const currentStructure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'cards' AND column_name = 'card_number';
        `);
        
        if (currentStructure.rows.length === 0) {
            console.log('❌ Tabela cards ou coluna card_number não encontrada');
            return;
        }
        
        console.log('📊 Estrutura atual:', currentStructure.rows[0]);
        
        // Aplicar correção
        console.log('🔧 Aplicando correção: ALTER COLUMN card_number TYPE VARCHAR(20)...');
        
        await pool.query('ALTER TABLE cards ALTER COLUMN card_number TYPE VARCHAR(20);');
        
        console.log('✅ Correção aplicada com sucesso!');
        
        // Verificar se foi aplicada corretamente
        console.log('🔍 Verificando estrutura após correção...');
        const newStructure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'cards' AND column_name = 'card_number';
        `);
        
        console.log('📊 Nova estrutura:', newStructure.rows[0]);
        
        if (newStructure.rows[0].character_maximum_length >= 20) {
            console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('   ✅ Campo card_number agora suporta até 20 caracteres');
            console.log('   ✅ Problema de "value too long" resolvido');
        } else {
            console.log('⚠️  Correção aplicada, mas tamanho pode ainda estar limitado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao aplicar correção:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('🔚 Conexão fechada');
    }
}

// Executar correção
fixCardNumberLength().catch(console.error);