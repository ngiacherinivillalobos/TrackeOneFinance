#!/usr/bin/env node

// Script para verificar se há problemas com as migrações
const fs = require('fs');
const path = require('path');

function checkMigrations() {
  try {
    console.log('🔍 Verificando arquivos de migração...');
    
    // Diretório de migrações
    const migrationsDir = path.resolve(__dirname, 'database', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Diretório de migrações não encontrado:', migrationsDir);
      process.exit(1);
    }
    
    // Listar arquivos de migração
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`\n📁 Encontrados ${migrationFiles.length} arquivos de migração:`);
    migrationFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // Verificar se há migrações específicas para PostgreSQL e SQLite
    const postgresMigrations = migrationFiles.filter(file => file.includes('_postgres.sql'));
    const sqliteMigrations = migrationFiles.filter(file => 
      file.endsWith('.sql') && !file.includes('_postgres.sql') && !file.includes('_sqlite.sql')
    );
    
    console.log(`\n🐘 Migrações específicas para PostgreSQL: ${postgresMigrations.length}`);
    postgresMigrations.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    console.log(`\n🐢 Migrações para SQLite: ${sqliteMigrations.length}`);
    sqliteMigrations.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // Verificar pares de migrações
    console.log('\n🔍 Verificando pares de migrações...');
    const migrationPairs = new Map();
    
    sqliteMigrations.forEach(sqliteFile => {
      const baseName = sqliteFile.replace('.sql', '');
      const postgresFile = `${baseName}_postgres.sql`;
      
      migrationPairs.set(baseName, {
        sqlite: sqliteFile,
        postgres: postgresMigrations.includes(postgresFile) ? postgresFile : null
      });
    });
    
    // Adicionar migrações específicas do PostgreSQL que não têm equivalentes SQLite
    postgresMigrations.forEach(postgresFile => {
      const baseName = postgresFile.replace('_postgres.sql', '');
      if (!migrationPairs.has(baseName)) {
        migrationPairs.set(baseName, {
          sqlite: null,
          postgres: postgresFile
        });
      }
    });
    
    console.log('\n🔗 Pares de migrações encontrados:');
    migrationPairs.forEach((pair, baseName) => {
      console.log(`  ${baseName}:`);
      console.log(`    SQLite: ${pair.sqlite || '❌ Não encontrado'}`);
      console.log(`    PostgreSQL: ${pair.postgres || '❌ Não encontrado'}`);
      
      // Verificar se ambos existem
      if (pair.sqlite && !pair.postgres) {
        console.log(`    ⚠️  Aviso: Migração SQLite existe mas PostgreSQL não`);
      } else if (!pair.sqlite && pair.postgres) {
        console.log(`    ℹ️  Info: Migração específica para PostgreSQL apenas`);
      } else if (pair.sqlite && pair.postgres) {
        console.log(`    ✅ OK: Ambas as migrações existem`);
      }
    });
    
    console.log('\n✅ Verificação de migrações concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao verificar migrações:', error);
    process.exit(1);
  }
}

checkMigrations();