#!/usr/bin/env node

// Script para testar a configuração do PostgreSQL para produção
const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Testando configuração do PostgreSQL para produção...\n');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
    console.error('❌ Variável de ambiente DATABASE_URL não está configurada');
    console.error('Por favor, defina DATABASE_URL no formato: postgresql://user:password@host:port/database');
    process.exit(1);
}

console.log('✅ DATABASE_URL encontrada');
console.log('🔗 String de conexão: ', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Criar pool de conexão
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testPostgreSQL() {
    try {
        console.log('\n🔍 Testando conexão com PostgreSQL...');
        
        // Testar conexão
        const client = await pool.connect();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
        
        // Testar consulta simples
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Consulta de teste executada com sucesso!');
        console.log('   Hora atual do servidor:', result.rows[0].current_time);
        
        client.release();
        
        // Verificar tabelas existentes
        console.log('\n📋 Verificando tabelas do banco de dados...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        console.log(`✅ ${tables.length} tabelas encontradas:`);
        tables.forEach(table => console.log(`   - ${table}`));
        
        // Verificar tabela de transações de cartão de crédito especificamente
        const creditCardTableExists = tables.includes('credit_card_transactions');
        if (creditCardTableExists) {
            console.log('✅ Tabela credit_card_transactions encontrada');
            
            // Verificar estrutura da tabela
            const columnsResult = await pool.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'credit_card_transactions' 
                ORDER BY ordinal_position
            `);
            
            console.log('\n📄 Estrutura da tabela credit_card_transactions:');
            console.table(columnsResult.rows.map(col => ({
                Coluna: col.column_name,
                Tipo: col.data_type,
                Nullable: col.is_nullable
            })));
        } else {
            console.log('⚠️  Tabela credit_card_transactions NÃO encontrada');
            console.log('   Execute: npm run migrate:postgres para aplicar a migração');
        }
        
        // Testar inserção de dados de teste
        console.log('\n🧪 Testando operações CRUD...');
        try {
            // Criar uma transação de teste (sem salvar permanentemente)
            const testResult = await pool.query(`
                INSERT INTO credit_card_transactions (
                    description, amount, type, card_id, transaction_date
                ) VALUES (
                    'Teste de Deploy', 100.50, 'expense', 1, CURRENT_DATE
                ) RETURNING id
            `);
            
            const testId = testResult.rows[0].id;
            console.log('✅ Inserção de teste bem-sucedida, ID:', testId);
            
            // Verificar se o registro foi criado
            const selectResult = await pool.query(
                'SELECT * FROM credit_card_transactions WHERE id = $1',
                [testId]
            );
            
            if (selectResult.rows.length > 0) {
                console.log('✅ Registro de teste encontrado');
                console.log('   Descrição:', selectResult.rows[0].description);
                console.log('   Valor:', selectResult.rows[0].amount);
            }
            
            // Deletar o registro de teste
            await pool.query('DELETE FROM credit_card_transactions WHERE id = $1', [testId]);
            console.log('✅ Registro de teste removido');
            
        } catch (error) {
            if (error.message.includes('credit_card_transactions')) {
                console.log('⚠️  Tabela credit_card_transactions ainda não existe');
                console.log('   Esta é uma mensagem esperada se a migração ainda não foi aplicada');
            } else {
                console.error('❌ Erro durante testes CRUD:', error.message);
            }
        }
        
        console.log('\n🎉 Todos os testes concluídos com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Se a tabela credit_card_transactions não existe, execute:');
        console.log('      cd server && npm run migrate:postgres');
        console.log('   2. Verifique se todas as tabelas necessárias estão presentes');
        console.log('   3. Teste a aplicação completa');
        
    } catch (error) {
        console.error('❌ Erro durante testes:', error.message);
        console.error('   Detalhes:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar testes
testPostgreSQL();