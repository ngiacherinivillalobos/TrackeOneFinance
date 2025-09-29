// Teste específico: saldo NÃO deve incluir transações pagas com cartão
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
          const jsonData = JSON.parse(data);
          resolve({ 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({ 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testSaldoCartao() {
  try {
    console.log('🧪 Testando: Saldo NÃO deve incluir transações pagas com cartão...');
    
    // 1. Pegar conta de teste
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    
    if (!accountsResponse.ok) {
      throw new Error(`Erro ao buscar contas: ${accountsResponse.status}`);
    }
    
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log('✅ Conta para teste:', testAccount.name);
    
    // 2. Verificar saldo ANTES
    const balanceBeforeResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceBefore = balanceBeforeResponse.data;
    console.log('\n💰 Saldo ANTES:', {
      current_balance: balanceBefore.current_balance,
      total_movements: balanceBefore.total_movements
    });
    
    // 3. Criar uma transação (despesa)
    console.log('\n📝 Criando transação de teste...');
    
    const transactionData = {
      description: "Teste Cartão - NÃO deve afetar saldo",
      amount: 1000,
      type: "expense",
      category_id: 25, // Alimentação
      contact_id: 17, // Dog Food Natural
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      is_paid: false
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    const transaction = createResponse.data.transaction;
    console.log('✅ Transação criada (ID):', transaction.id);
    
    // 4. Marcar como paga com CARTÃO DE CRÉDITO
    console.log('\n💳 Marcando como paga com CARTÃO...');
    
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 1000,
      payment_type: "credit_card", // CARTÃO - NÃO DEVE AFETAR SALDO
      card_id: 5,
      observations: "Pago com cartão - não deve afetar saldo"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    if (!paymentResponse.ok) {
      throw new Error(`Erro ao marcar como pago: ${paymentResponse.status} - ${JSON.stringify(paymentResponse.data)}`);
    }
    
    console.log('✅ Transação marcada como paga com cartão');
    
    // 5. Verificar saldo APÓS
    const balanceAfterResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceAfter = balanceAfterResponse.data;
    console.log('\n💰 Saldo APÓS:', {
      current_balance: balanceAfter.current_balance,
      total_movements: balanceAfter.total_movements
    });
    
    // 6. Validar que o saldo NÃO mudou
    const saldoMudou = balanceAfter.current_balance !== balanceBefore.current_balance;
    const movimentoMudou = balanceAfter.total_movements !== balanceBefore.total_movements;
    
    console.log('\n📊 ANÁLISE:');
    console.log(`• Despesa de R$ ${transactionData.amount} paga com CARTÃO`);
    console.log(`• Saldo mudou: ${saldoMudou ? 'SIM (❌ ERRO)' : 'NÃO (✅ CORRETO)'}`);
    console.log(`• Movimento mudou: ${movimentoMudou ? 'SIM (❌ ERRO)' : 'NÃO (✅ CORRETO)'}`);
    
    if (!saldoMudou && !movimentoMudou) {
      console.log('\n✅ SUCESSO: Saldo corretamente NÃO foi afetado por pagamento com cartão!');
    } else {
      console.log('\n❌ ERRO: Saldo foi incorretamente afetado por pagamento com cartão!');
      console.log('Diferença no saldo:', balanceAfter.current_balance - balanceBefore.current_balance);
      console.log('Diferença no movimento:', balanceAfter.total_movements - balanceBefore.total_movements);
    }
    
    // 7. Teste adicional: marcar outra transação como paga com CONTA CORRENTE
    console.log('\n🏦 Teste adicional: pagamento com CONTA CORRENTE...');
    
    // Criar segunda transação (receita)
    const transaction2Data = {
      description: "Teste Conta Corrente - DEVE afetar saldo",
      amount: 500,
      type: "income",
      category_id: 7, // Empréstimo
      contact_id: 1,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      is_paid: false
    };
    
    const createResponse2 = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transaction2Data
    });
    
    const transaction2 = createResponse2.data.transaction;
    console.log('✅ Segunda transação criada (ID):', transaction2.id);
    
    // Marcar como paga com CONTA CORRENTE
    const payment2Data = {
      payment_date: "2024-10-01",
      paid_amount: 500,
      payment_type: "bank_account", // CONTA CORRENTE - DEVE AFETAR SALDO
      bank_account_id: testAccount.id,
      observations: "Pago com conta corrente - deve afetar saldo"
    };
    
    const payment2Response = await makeRequest(`${baseURL}/api/transactions/${transaction2.id}/mark-as-paid`, {
      method: 'POST',
      body: payment2Data
    });
    
    console.log('✅ Segunda transação marcada como paga com conta corrente');
    
    // Verificar saldo FINAL
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log('\n💰 Saldo FINAL:', {
      current_balance: balanceFinal.current_balance,
      total_movements: balanceFinal.total_movements
    });
    
    const expectedChange = 500; // Apenas a receita paga com conta corrente
    const actualChange = balanceFinal.total_movements - balanceBefore.total_movements;
    
    console.log('\n📊 ANÁLISE FINAL:');
    console.log(`• Despesa R$ 1000 (cartão): NÃO deve afetar`);
    console.log(`• Receita R$ 500 (conta corrente): DEVE afetar`);
    console.log(`• Mudança esperada: +R$ ${expectedChange}`);
    console.log(`• Mudança real: +R$ ${actualChange}`);
    
    if (actualChange === expectedChange) {
      console.log('\n🎉 SUCESSO TOTAL: Lógica funcionando perfeitamente!');
      console.log('✅ Cartão NÃO afeta saldo');
      console.log('✅ Conta corrente AFETA saldo');
    } else {
      console.log('\n❌ ERRO: Lógica ainda incorreta');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testSaldoCartao();