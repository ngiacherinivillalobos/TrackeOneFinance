// Teste REAL do problema reportado pelo usuário
const https = require('https');
const http = require('http');
const { URL } = require('url');

const baseURL = 'http://localhost:3001';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoidGVzdDJAZXhhbXBsZS5jb20iLCJjb3N0X2NlbnRlcl9pZCI6bnVsbCwiaWF0IjoxNzU5MTcxMjc3LCJleHAiOjE3NjE3NjMyNzd9.PCb14cGrmtvjK0zgF-EGravY40Ql1Jkny3svmhJKfiU';

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

async function testScenarioReal() {
  try {
    console.log('🧪 Testando cenário REAL reportado pelo usuário...');
    console.log('📋 Cenário: Despesa não paga → Marcar como paga com cartão → Verificar se saldo foi afetado');
    
    // 1. Buscar uma conta bancária real
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log(`\n🏦 Conta para teste: ${testAccount.name} (ID: ${testAccount.id})`);
    
    // 2. Verificar saldo ANTES
    const balanceBeforeResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceBefore = balanceBeforeResponse.data;
    console.log('\n💰 Saldo ANTES do teste:', {
      current_balance: balanceBefore.current_balance,
      total_movements: balanceBefore.total_movements
    });
    
    // 3. Criar uma despesa vinculada à conta corrente (NÃO PAGA)
    console.log('\n📝 Criando despesa vinculada à conta corrente...');
    
    const transactionData = {
      description: "Teste Crítico - Despesa",
      amount: 1200,
      type: "expense",
      category_id: 25, // Alimentação
      contact_id: 17, // Dog Food Natural
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      bank_account_id: testAccount.id,
      is_paid: false
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    const transaction = createResponse.data.transaction;
    console.log(`✅ Despesa criada (ID: ${transaction.id})`);
    
    // 4. Verificar saldo APÓS CRIAÇÃO (deve ser igual ao anterior)
    const balanceAfterCreateResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceAfterCreate = balanceAfterCreateResponse.data;
    console.log('\n💰 Saldo APÓS criação da despesa (ainda não paga):', {
      current_balance: balanceAfterCreate.current_balance,
      total_movements: balanceAfterCreate.total_movements
    });
    
    // 5. Buscar um cartão para o teste
    const cardsResponse = await makeRequest(`${baseURL}/api/cards`);
    const cards = cardsResponse.data;
    const testCard = cards[0];
    console.log(`\n💳 Cartão para teste: ${testCard.name} (ID: ${testCard.id})`);
    
    // 6. PONTO CRÍTICO: Marcar como paga com CARTÃO DE CRÉDITO
    console.log('\n🚨 MOMENTO CRÍTICO: Marcando despesa como paga com CARTÃO...');
    
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 1200,
      payment_type: "credit_card",
      card_id: testCard.id,
      observations: "Teste: Pagamento com cartão NÃO deve afetar saldo de conta corrente"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    console.log('✅ Despesa marcada como paga com cartão');
    console.log('📄 Resposta da API:', JSON.stringify(paymentResponse.data, null, 2));
    
    // 7. VERIFICAÇÃO CRÍTICA: Saldo APÓS pagamento com cartão
    const balanceAfterPaymentResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceAfterPayment = balanceAfterPaymentResponse.data;
    console.log('\n💰 Saldo APÓS pagamento com cartão:', {
      current_balance: balanceAfterPayment.current_balance,
      total_movements: balanceAfterPayment.total_movements
    });
    
    // 8. ANÁLISE DOS RESULTADOS
    console.log('\n📊 ANÁLISE CRÍTICA:');
    console.log(`• Saldo antes: R$ ${balanceBefore.current_balance}`);
    console.log(`• Saldo após criação: R$ ${balanceAfterCreate.current_balance}`);  
    console.log(`• Saldo após pagamento com cartão: R$ ${balanceAfterPayment.current_balance}`);
    
    const saldoMudou = balanceBefore.current_balance !== balanceAfterPayment.current_balance;
    const movimentosMudaram = balanceBefore.total_movements !== balanceAfterPayment.total_movements;
    
    if (saldoMudou || movimentosMudaram) {
      console.log('\n❌ PROBLEMA CONFIRMADO!');
      console.log('🚨 O pagamento com cartão de crédito AFETOU incorretamente o saldo da conta corrente');
      console.log('💡 Isso não deveria acontecer - cartão de crédito não mexe no dinheiro da conta bancária');
      
      if (saldoMudou) {
        const diferenca = balanceAfterPayment.current_balance - balanceBefore.current_balance;
        console.log(`💸 Diferença no saldo: R$ ${diferenca}`);
      }
      
      if (movimentosMudaram) {
        const diferencaMovimentos = balanceAfterPayment.total_movements - balanceBefore.total_movements;
        console.log(`📈 Diferença nos movimentos: R$ ${diferencaMovimentos}`);
      }
    } else {
      console.log('\n✅ CORRETO!');
      console.log('👍 O pagamento com cartão NÃO afetou o saldo da conta corrente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testScenarioReal();