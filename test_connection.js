// Teste simples de conexão com o backend
const http = require('http');

const testConnection = () => {
  console.log('Testando conexão com o backend...');
  
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Resposta:', data);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
    process.exit(1);
  });

  req.write(postData);
  req.end();
};

// Testar após 2 segundos para dar tempo do servidor estar pronto
setTimeout(testConnection, 2000);