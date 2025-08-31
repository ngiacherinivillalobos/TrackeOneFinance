const axios = require('axios');

// Função para verificar se o servidor está respondendo
async function checkServer() {
  console.log('=== Verificação do Servidor ===\n');
  
  const endpoints = [
    { url: 'http://localhost:3001/api/test', name: 'Endpoint de teste' },
    { url: 'http://localhost:3001/api/auth/validate', name: 'Endpoint de validação (sem token)' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Verificando ${endpoint.name}...`);
      const response = await axios.get(endpoint.url, { timeout: 5000 });
      console.log(`✅ ${endpoint.name} está respondendo`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Dados: ${JSON.stringify(response.data).substring(0, 100)}${JSON.stringify(response.data).length > 100 ? '...' : ''}`);
      console.log();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint.name} não está acessível (servidor desligado?)`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`❌ ${endpoint.name} está demorando muito para responder (timeout)`);
      } else if (error.response) {
        console.log(`⚠️  ${endpoint.name} respondeu com status ${error.response.status}`);
        console.log(`   Mensagem: ${error.response.data?.error || error.response.data?.message || 'Sem mensagem'}`);
      } else {
        console.log(`❌ Erro ao verificar ${endpoint.name}: ${error.message}`);
      }
      console.log();
    }
  }
  
  console.log('💡 Dica: Certifique-se de que o servidor está rodando com "npm run server"');
}

// Executar verificação
checkServer().catch(console.error);