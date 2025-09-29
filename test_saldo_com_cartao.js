// Teste com saldo existente na conta
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
          const responseData = res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data;
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

async function testComSaldoExistente() {
  try {
    console.log('🧪 Teste final: Conta com saldo → Pagamento com cartão → Verificar se saldo permanece');
    
    // 1. Buscar conta
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log(`\n🏦 Conta: ${testAccount.name}`);
    
    // 2. Primeiro, criar uma RECEITA paga com conta corrente para gerar saldo
    console.log('\n📈 Criando receita paga com conta corrente para gerar saldo...');
    
    const receitaData = {
      description: "Receita Teste - Gerar Saldo",
      amount: 5000,
      type: "income",
      category_id: 1, // Receita
      contact_id: 17,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      bank_account_id: testAccount.id,
      is_paid: false
    };
    
    const createReceitaResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: receitaData
    });
    
    const receita = createReceitaResponse.data.transaction;
    
    // Marcar receita como paga com conta corrente
    const paymentReceitaData = {
      payment_date: "2024-10-01",
      paid_amount: 5000,
      payment_type: "bank_account",
      bank_account_id: testAccount.id,
      observations: "Receita paga com conta corrente"
    };
    
    await makeRequest(`${baseURL}/api/transactions/${receita.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentReceitaData
    });
    
    console.log('✅ Receita criada e paga com conta corrente');
    
    // 3. Verificar saldo APÓS receita
    const balanceComSaldoResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceComSaldo = balanceComSaldoResponse.data;
    console.log('\n💰 Saldo APÓS receita (deve ter R$ 5.000):', {
      current_balance: balanceComSaldo.current_balance,
      total_movements: balanceComSaldo.total_movements
    });
    
    // 4. Agora criar despesa e pagar com cartão
    console.log('\n📝 Criando despesa para pagar com cartão...');
    
    const despesaData = {
      description: "Despesa Teste - Pagar com Cartão",
      amount: 1200,
      type: "expense",
      category_id: 25,
      contact_id: 17,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      bank_account_id: testAccount.id,
      is_paid: false
    };
    
    const createDespesaResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: despesaData
    });
    
    const despesa = createDespesaResponse.data.transaction;
    
    // 5. Buscar cartão
    const cardsResponse = await makeRequest(`${baseURL}/api/cards`);
    const cards = cardsResponse.data;
    const testCard = cards[0];
    
    // 6. CRÍTICO: Pagar despesa com cartão
    console.log('\n🚨 TESTE CRÍTICO: Pagando despesa de R$ 1.200 com CARTÃO...');
    
    const paymentDespesaData = {
      payment_date: "2024-10-01",
      paid_amount: 1200,
      payment_type: "credit_card",
      card_id: testCard.id,
      observations: "TESTE: Cartão não deve afetar saldo de R$ 5.000"
    };
    
    await makeRequest(`${baseURL}/api/transactions/${despesa.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentDespesaData
    });
    
    console.log('✅ Despesa paga com cartão');
    
    // 7. Verificar saldo FINAL
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log('\n💰 Saldo FINAL (deve permanecer R$ 5.000):', {
      current_balance: balanceFinal.current_balance,
      total_movements: balanceFinal.total_movements
    });
    
    // 8. VALIDAÇÃO
    console.log('\n📊 VALIDAÇÃO FINAL:');
    console.log(`• Saldo com receita: R$ ${balanceComSaldo.current_balance}`);
    console.log(`• Saldo após pagar R$ 1.200 com cartão: R$ ${balanceFinal.current_balance}`);
    
    if (balanceComSaldo.current_balance === balanceFinal.current_balance) {
      console.log('\n✅ PERFEITO! Pagamento com cartão NÃO afetou o saldo da conta corrente!');
      console.log('👍 O saldo permaneceu R$ 5.000 mesmo após pagar R$ 1.200 com cartão');
    } else {
      console.log('\n❌ PROBLEMA! O saldo foi afetado incorretamente');
      const diferenca = balanceFinal.current_balance - balanceComSaldo.current_balance;
      console.log(`💸 Diferença: R$ ${diferenca}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testComSaldoExistente();