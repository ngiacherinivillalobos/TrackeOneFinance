// Teste CRÍTICO: Pagamento com cartão não deve afetar saldo da conta corrente
const https = require('https');
const http = require('http');
const { URL } = require('url');

const baseURL = 'http://localhost:3001';

// Token JWT válido
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoidGVzdDJAZXhhbXBsZS5jb20iLCJjb3N0X2NlbnRlcl9pZCI6bnVsbCwiaWF0IjoxNzU5MTcxMjc3LCJleHAiOjE3NjE3NjMyNzd9.PCb14cGrmtvjK0zgF-EGravY40Ql1Jkny3svmhJKfiU';

// Função helper para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          let responseData;
          if (res.headers['content-type']?.includes('application/json')) {
            responseData = JSON.parse(data);
          } else {
            responseData = data;
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: responseData, status: res.statusCode });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (parseError) {
          reject(new Error(`Parse error: ${parseError.message}, Data: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCartaoNaoAfetaSaldo() {
  try {
    console.log('🧪 Teste CRÍTICO: Pagamento com cartão NÃO deve afetar saldo de conta corrente...');
    
    // 1. Pegar conta de teste
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log('✅ Conta para teste:', testAccount.name);
    
    // 2. Verificar saldo INICIAL
    const balanceInitialResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceInitial = balanceInitialResponse.data;
    console.log('\n💰 Saldo INICIAL da conta corrente:', {
      current_balance: balanceInitial.current_balance,
      total_movements: balanceInitial.total_movements
    });
    
    // 3. Criar uma despesa vinculada à conta corrente
    console.log('\n📝 Criando DESPESA vinculada à conta corrente...');
    
    const transactionData = {
      description: "Despesa Teste - Pagar com Cartão",
      amount: 1200,
      type: "expense",
      category_id: 25, // Alimentação
      contact_id: 17, // Dog Food Natural
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      bank_account_id: testAccount.id, // IMPORTANTE: vinculada inicialmente à conta corrente
      is_paid: false
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    const transaction = createResponse.data.transaction;
    console.log('✅ Despesa criada (ID):', transaction.id);
    
    // 4. Pegar cartão para teste
    const cardsResponse = await makeRequest(`${baseURL}/api/cards`);
    const cards = cardsResponse.data;
    const testCard = cards[0];
    console.log('✅ Cartão para teste:', testCard.name);
    
    // 5. Marcar como paga com CARTÃO DE CRÉDITO
    console.log('\n💳 Marcando como paga com CARTÃO DE CRÉDITO...');
    
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 1200,
      payment_type: "credit_card", // CRÍTICO: pagamento com cartão
      card_id: testCard.id,
      observations: "Pago com cartão - NÃO deve afetar saldo da conta corrente"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    console.log('✅ Despesa marcada como paga com cartão');
    
    // 6. Verificar saldo APÓS PAGAMENTO COM CARTÃO
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log('\n💰 Saldo APÓS pagamento com cartão:', {
      current_balance: balanceFinal.current_balance,
      total_movements: balanceFinal.total_movements
    });
    
    // 7. VALIDAÇÃO CRÍTICA
    console.log('\n🔍 Validação crítica...');
    
    const saldoDevePermanerIgual = balanceInitial.current_balance === balanceFinal.current_balance;
    const movimentosDevemPermanerIguais = balanceInitial.total_movements === balanceFinal.total_movements;
    
    console.log('📊 Análise dos resultados:');
    console.log(`• Saldo inicial: R$ ${balanceInitial.current_balance}`);
    console.log(`• Saldo após pagamento com cartão: R$ ${balanceFinal.current_balance}`);
    console.log(`• Movimentos iniciais: R$ ${balanceInitial.total_movements}`);
    console.log(`• Movimentos após pagamento: R$ ${balanceFinal.total_movements}`);
    
    if (saldoDevePermanerIgual && movimentosDevemPermanerIguais) {
      console.log('\n✅ SUCESSO: Pagamento com cartão NÃO afetou o saldo da conta corrente!');
    } else {
      console.log('\n❌ ERRO: Pagamento com cartão AFETOU incorretamente o saldo da conta corrente!');
      console.log('🚨 Problema identificado: O sistema está considerando transações pagas com cartão no cálculo do saldo da conta corrente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testCartaoNaoAfetaSaldo();