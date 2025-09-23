#!/usr/bin/env node

// Script para aplicar a correção do tamanho da coluna card_number na tabela cards no SQLite
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('=== Aplicando correção do tamanho da coluna card_number na tabela cards (SQLite) ===');

// Caminho para o banco de dados SQLite
const dbPath = path.join(__dirname, '..', '..', 'database', 'track_one_finance.db');

// Verificar se o arquivo do banco de dados existe
if (!fs.existsSync(dbPath)) {
    console.error('❌ Arquivo do banco de dados não encontrado:', dbPath);
    process.exit(1);
}

// Abrir conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir o banco de dados:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado ao banco de dados SQLite');
});

// Função para aplicar a correção
function applyFix() {
    return new Promise((resolve, reject) => {
        // Iniciar uma transação
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Verificar se a tabela cards existe
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'", (err, row) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }
                
                if (!row) {
                    console.log('❌ Tabela cards não encontrada');
                    db.run('ROLLBACK');
                    resolve();
                    return;
                }
                
                console.log('✅ Tabela cards encontrada');
                
                // Verificar a estrutura atual da tabela
                db.all("PRAGMA table_info(cards)", (err, rows) => {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    console.log('\n=== Estrutura atual da tabela cards ===');
                    rows.forEach(row => {
                        console.log(`${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
                    });
                    
                    // Como SQLite não suporta ALTER COLUMN diretamente para mudar o tamanho,
                    // vamos verificar se a coluna card_number já é do tipo TEXT (que não tem limite de tamanho)
                    const cardNumberColumn = rows.find(row => row.name === 'card_number');
                    if (cardNumberColumn && cardNumberColumn.type === 'TEXT') {
                        console.log('\n✅ A coluna card_number já está com o tipo TEXT (sem limite de tamanho)');
                        db.run('COMMIT');
                        resolve();
                        return;
                    }
                    
                    // Se for necessário, aplicar a correção completa
                    console.log('\n=== Aplicando correção completa ===');
                    
                    // Ler o script de correção
                    const fixPath = path.join(__dirname, 'fix_card_number_length_sqlite.sql');
                    const fixScript = fs.readFileSync(fixPath, 'utf8');
                    
                    // Dividir o script em comandos separados
                    const commands = fixScript.split(';').filter(cmd => cmd.trim() !== '');
                    
                    console.log(`Executando ${commands.length} comandos de correção...`);
                    
                    let commandIndex = 0;
                    function executeNextCommand() {
                        if (commandIndex >= commands.length) {
                            console.log('✅ Todos os comandos executados com sucesso');
                            db.run('COMMIT');
                            resolve();
                            return;
                        }
                        
                        const command = commands[commandIndex].trim();
                        if (command === '') {
                            commandIndex++;
                            executeNextCommand();
                            return;
                        }
                        
                        console.log(`Executando comando ${commandIndex + 1}/${commands.length}: ${command.substring(0, 50)}...`);
                        
                        db.run(command, (err) => {
                            if (err) {
                                console.error(`Erro ao executar comando ${commandIndex + 1}:`, err.message);
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            
                            commandIndex++;
                            executeNextCommand();
                        });
                    }
                    
                    executeNextCommand();
                });
            });
        });
    });
}

// Executar a correção
applyFix()
    .then(() => {
        console.log('\n✅ Script de correção concluído com sucesso!');
        db.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro durante a execução do script:', error.message);
        db.close();
        process.exit(1);
    });