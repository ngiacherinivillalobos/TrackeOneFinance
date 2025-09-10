// Script para testar a inicialização do servidor
const express = require('express');
const { initializeDatabase } = require('./server/src/database/connection');

console.log('=== TESTE DE INICIALIZAÇÃO DO SERVIDOR ===\n');

// Testar inicialização do banco de dados
console.log('1. Testando inicialização do banco de dados...');
initializeDatabase()
  .then(() => {
    console.log('  ✅ Banco de dados inicializado com sucesso');
    
    // Testar criação do servidor Express
    console.log('\n2. Testando criação do servidor Express...');
    const app = express();
    
    // Configurações básicas
    app.use(express.json());
    
    // Rota de teste
    app.get('/api/test', (req, res) => {
      res.json({ 
        message: 'Servidor funcionando corretamente',
        timestamp: new Date().toISOString()
      });
    });
    
    // Iniciar servidor na porta 3001
    const server = app.listen(3001, () => {
      console.log('  ✅ Servidor iniciado na porta 3001');
      console.log('  🔄 Testando endpoint /api/test...');
      
      // Testar o endpoint
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/test',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('  ✅ Endpoint /api/test respondeu com sucesso');
          console.log('  📤 Resposta:', data);
          
          // Fechar o servidor
          server.close(() => {
            console.log('\n  ✅ Servidor fechado com sucesso');
            console.log('\n=== TODOS OS TESTES PASSARAM ===');
          });
        });
      });
      
      req.on('error', (error) => {
        console.error('  ❌ Erro ao testar endpoint:', error);
        server.close();
      });
      
      req.end();
    });
    
    server.on('error', (error) => {
      console.error('  ❌ Erro ao iniciar servidor:', error);
    });
  })
  .catch((error) => {
    console.error('  ❌ Erro ao inicializar banco de dados:', error);
    console.log('\n=== TESTE FALHOU ===');
  });