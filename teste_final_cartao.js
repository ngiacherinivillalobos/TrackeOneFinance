// TESTE FINAL: Transações com payment_type = 'credit_card' NÃO devem afetar saldo
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
      res.on('data', (chunk) => { data += chunk; });
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
    
    req.on('error', (error) => { reject(new Error(`Request error: ${error.message}`)); });
    if (options.body) { req.write(JSON.stringify(options.body)); }
    req.end();
  });
}

async function testeFinalCartao() {
  try {
    console.log('🔥 TESTE FINAL: payment_type = "credit_card" NÃO deve afetar saldo');
    
    // 1. Pegar conta de teste
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log(`✅ Conta: ${testAccount.name} (ID: ${testAccount.id})`);
    
    // 2. Saldo INICIAL
    const balanceInitialResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceInitial = balanceInitialResponse.data;
    console.log(`\n💰 Saldo INICIAL: R$ ${balanceInitial.current_balance}`);
    
    // 3. Criar despesa de R$ 2.000
    const transactionData = {
      description: "TESTE FINAL - Despesa R$ 2.000",
      amount: 2000,
      type: "expense",
      category_id: 25,
      contact_id: 17,
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
    console.log(`\n📝 Despesa criada: R$ ${transaction.amount} (ID: ${transaction.id})`);
    
    // 4. Pegar cartão
    const cardsResponse = await makeRequest(`${baseURL}/api/cards`);
    const cards = cardsResponse.data;
    const testCard = cards[0];
    
    // 5. Marcar como paga com CARTÃO
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 2000,
      payment_type: "credit_card", // CRÍTICO!
      card_id: testCard.id,
      observations: "TESTE FINAL: Pago com cartão - NÃO deve afetar saldo"
    };
    
    console.log('\n💳 Marcando R$ 2.000 como paga com CARTÃO...');
    
    await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    console.log('✅ Transação marcada como paga com cartão');
    
    // 6. Verificar saldo FINAL
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log(`\n💰 Saldo FINAL: R$ ${balanceFinal.current_balance}`);
    
    // 7. Verificar se a transação tem payment_type = 'credit_card'
    const updatedResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}`);
    const updatedTransaction = updatedResponse.data;
    
    console.log('\n🔍 Verificação da transação:');
    console.log(`   Payment Type: ${updatedTransaction.payment_type}`);
    console.log(`   Bank Account ID: ${updatedTransaction.bank_account_id}`);
    console.log(`   Is Paid: ${updatedTransaction.is_paid}`);
    
    // 8. VALIDAÇÃO FINAL
    console.log('\n📊 VALIDAÇÃO FINAL:');
    console.log(`• Saldo inicial: R$ ${balanceInitial.current_balance}`);
    console.log(`• Despesa paga com cartão: R$ 2.000`);
    console.log(`• Saldo final: R$ ${balanceFinal.current_balance}`);
    
    const saldoMudou = balanceInitial.current_balance !== balanceFinal.current_balance;
    
    if (saldoMudou) {
      console.log('\n❌ ERRO CRÍTICO!');
      console.log('🚨 Transação com payment_type = "credit_card" AFETOU o saldo!');
      console.log(`💸 Diferença no saldo: R$ ${balanceFinal.current_balance - balanceInitial.current_balance}`);
      console.log('🔧 A consulta SQL precisa ser corrigida para EXCLUIR payment_type = "credit_card"');
    } else {
      console.log('\n✅ CORRETO!');
      console.log('🎯 payment_type = "credit_card" NÃO afetou o saldo da conta corrente!');
      console.log('👍 Problema resolvido definitivamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testeFinalCartao();