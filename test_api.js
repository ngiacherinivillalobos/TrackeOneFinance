const jwt = require('jsonwebtoken');const axios = require('axios');

const fetch = require('node-fetch');

// Configuração da API

// Usar a mesma secret do códigoconst API_BASE_URL = 'http://localhost:3001';

const SECRET = process.env.JWT_SECRET || 'trackeone_finance_secret_key_2025';const TEST_USER = {

  email: 'admin@trackone.com',

// Gerar token  password: 'admin123'

const token = jwt.sign({ userId: 1 }, SECRET, { expiresIn: '1h' });};

console.log('Token gerado:', token);

// Função para testar o endpoint de teste

// Fazer chamada para APIasync function testApiEndpoint() {

async function testAPI() {  console.log('=== Teste de Endpoint da API ===\n');

  try {  

    console.log('\n=== Testando API de transações ===');  try {

        const response = await axios.get(`${API_BASE_URL}/api/test`);

    // Testar com todas as transações (sem filtros de payment_status)    console.log('✅ Endpoint de teste acessado com sucesso');

    const responseAll = await fetch('http://localhost:3001/api/transactions/filtered?month=0&year=2025&dateFilterType=month', {    console.log('Resposta:', response.data);

      headers: {    console.log();

        'Authorization': `Bearer ${token}`,  } catch (error) {

        'Content-Type': 'application/json'    console.error('❌ Erro ao acessar endpoint de teste:', error.message);

      }    if (error.response) {

    });      console.error('Status:', error.response.status);

          console.error('Dados:', error.response.data);

    const allTransactions = await responseAll.json();    }

    console.log('\n--- TODAS as transações (Janeiro 2025) ---');  }

    console.log('Total de transações:', allTransactions.length || 'Error:', allTransactions);}

    

    if (Array.isArray(allTransactions)) {// Função para testar o login

      // Agrupar por tipoasync function testLogin() {

      const receitas = allTransactions.filter(t => t.type === 'income');  console.log('=== Teste de Login ===\n');

      const despesas = allTransactions.filter(t => t.type === 'expense');  

      const investimentos = allTransactions.filter(t => t.type === 'investment');  try {

          const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER);

      console.log(`Receitas: ${receitas.length} transações`);    console.log('✅ Login realizado com sucesso');

      console.log(`Despesas: ${despesas.length} transações`);    console.log('Token recebido:', response.data.token ? 'Sim' : 'Não');

      console.log(`Investimentos: ${investimentos.length} transações`);    console.log();

          

      // Calcular totais    // Testar validação do token

      const totalReceitas = receitas.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);    if (response.data.token) {

      const totalDespesas = despesas.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);      await testTokenValidation(response.data.token);

      const totalInvestimentos = investimentos.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);    }

          

      console.log(`\nTotais calculados:`)    return response.data.token;

      console.log(`Total Receitas: R$ ${totalReceitas.toFixed(2)}`);  } catch (error) {

      console.log(`Total Despesas: R$ ${totalDespesas.toFixed(2)}`);    console.error('❌ Erro no login:', error.message);

      console.log(`Total Investimentos: R$ ${totalInvestimentos.toFixed(2)}`);    if (error.response) {

            console.error('Status:', error.response.status);

      // Mostrar status de pagamento      console.error('Dados:', error.response.data);

      console.log('\n--- Status de pagamento ---');    }

      const pagas = allTransactions.filter(t => t.is_paid === 1);  }

      const naopagas = allTransactions.filter(t => t.is_paid === 0 || t.is_paid === null);}

      

      console.log(`Transações PAGAS: ${pagas.length}`);// Função para testar a validação do token

      console.log(`Transações NÃO PAGAS: ${naopagas.length}`);async function testTokenValidation(token) {

        console.log('=== Teste de Validação de Token ===\n');

      if (pagas.length > 0) {  

        console.log('Exemplos de transações pagas:');  try {

        pagas.slice(0, 3).forEach((t, i) => {    const response = await axios.get(`${API_BASE_URL}/api/auth/validate`, {

          console.log(`  ${i+1}. ${t.description} - R$ ${t.amount} (${t.type}) - ${t.is_paid === 1 ? 'PAGA' : 'NÃO PAGA'}`);      headers: {

        });        'Authorization': `Bearer ${token}`

      }      }

    }    });

        console.log('✅ Token validado com sucesso');

    // Testar com filtro de transações não pagas (filtro padrão do frontend)    console.log('Resposta:', response.data);

    console.log('\n--- Testando com filtro padrão (unpaid, overdue) ---');    console.log();

    const responseFiltered = await fetch('http://localhost:3001/api/transactions/filtered?month=0&year=2025&dateFilterType=month&payment_status=unpaid,overdue', {  } catch (error) {

      headers: {    console.error('❌ Erro na validação do token:', error.message);

        'Authorization': `Bearer ${token}`,    if (error.response) {

        'Content-Type': 'application/json'      console.error('Status:', error.response.status);

      }      console.error('Dados:', error.response.data);

    });    }

      }

    const filteredTransactions = await responseFiltered.json();}

    console.log('Transações filtradas (unpaid,overdue):', filteredTransactions.length || 'Error:', filteredTransactions);

    // Função para testar endpoints protegidos

  } catch (error) {async function testProtectedEndpoints(token) {

    console.error('Erro na API:', error.message);  console.log('=== Teste de Endpoints Protegidos ===\n');

  }  

}  const endpoints = [

    '/api/categories',

testAPI();    '/api/bank-accounts',
    '/api/contacts'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ ${endpoint} acessado com sucesso (${Array.isArray(response.data) ? response.data.length : 'N/A'} registros)`);
    } catch (error) {
      console.error(`❌ Erro ao acessar ${endpoint}:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
      }
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes da API TrackOne Finance\n');
  
  // Testar endpoint público
  await testApiEndpoint();
  
  // Testar autenticação
  const token = await testLogin();
  
  // Testar endpoints protegidos se o login foi bem-sucedido
  if (token) {
    await testProtectedEndpoints(token);
  }
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar testes
main().catch(console.error);