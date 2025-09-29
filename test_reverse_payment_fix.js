// Teste: saldo deve atualizar corretamente ao reverter pagamento
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

async function testReversePayment() {
  try {
    console.log('🧪 Testando: Saldo deve atualizar ao reverter pagamento...');
    
    // 1. Pegar conta de teste
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    const accounts = accountsResponse.data;
    const testAccount = accounts[0];
    console.log('✅ Conta para teste:', testAccount.name);
    
    // 2. Verificar saldo INICIAL
    const balanceInitialResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceInitial = balanceInitialResponse.data;
    console.log('\n💰 Saldo INICIAL:', {
      current_balance: balanceInitial.current_balance,
      total_movements: balanceInitial.total_movements
    });
    
    // 3. Criar uma receita
    console.log('\n📝 Criando receita de teste...');
    
    const transactionData = {
      description: "Receita Teste Reversão",
      amount: 800,
      type: "income",
      category_id: 7, // Empréstimo
      contact_id: 1,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      is_paid: false
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    const transaction = createResponse.data.transaction;
    console.log('✅ Receita criada (ID):', transaction.id);
    
    // 4. Marcar como paga com CONTA CORRENTE
    console.log('\n🏦 Marcando como paga com CONTA CORRENTE...');
    
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 800,
      payment_type: "bank_account",
      bank_account_id: testAccount.id,
      observations: "Pago via conta corrente - teste reversão"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    console.log('✅ Receita marcada como paga');
    
    // 5. Verificar saldo APÓS PAGAMENTO
    const balanceAfterPaymentResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceAfterPayment = balanceAfterPaymentResponse.data;
    console.log('\n💰 Saldo APÓS PAGAMENTO:', {
      current_balance: balanceAfterPayment.current_balance,
      total_movements: balanceAfterPayment.total_movements
    });
    
    const expectedIncrease = 800;
    const actualIncrease = balanceAfterPayment.total_movements - balanceInitial.total_movements;
    
    if (actualIncrease === expectedIncrease) {
      console.log('✅ Saldo aumentou corretamente após pagamento (+R$ 800)');
    } else {
      console.log(`❌ ERRO: Saldo não aumentou corretamente. Esperado: +${expectedIncrease}, Real: +${actualIncrease}`);
    }
    
    // 6. REVERTER O PAGAMENTO
    console.log('\n🔄 REVERTENDO O PAGAMENTO...');
    
    const reverseResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/reverse-payment`, {
      method: 'POST'
    });
    
    if (!reverseResponse.ok) {
      throw new Error(`Erro ao reverter pagamento: ${reverseResponse.status} - ${JSON.stringify(reverseResponse.data)}`);
    }
    
    console.log('✅ Pagamento revertido');
    
    // 7. Verificar saldo APÓS REVERSÃO
    console.log('\n💰 Verificando saldo APÓS REVERSÃO...');
    
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log('Saldo FINAL:', {
      current_balance: balanceFinal.current_balance,
      total_movements: balanceFinal.total_movements
    });
    
    // 8. Validar que o saldo voltou ao estado inicial
    const saldoVoltouAoInicial = balanceFinal.current_balance === balanceInitial.current_balance;
    const movimentoVoltouAoInicial = balanceFinal.total_movements === balanceInitial.total_movements;
    
    console.log('\n📊 ANÁLISE DA REVERSÃO:');
    console.log(`• Saldo inicial: R$ ${balanceInitial.current_balance}`);
    console.log(`• Saldo após pagamento: R$ ${balanceAfterPayment.current_balance} (+R$ ${actualIncrease})`);
    console.log(`• Saldo após reversão: R$ ${balanceFinal.current_balance}`);
    console.log(`• Saldo voltou ao inicial: ${saldoVoltouAoInicial ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`• Movimento voltou ao inicial: ${movimentoVoltouAoInicial ? 'SIM ✅' : 'NÃO ❌'}`);
    
    if (saldoVoltouAoInicial && movimentoVoltouAoInicial) {
      console.log('\n🎉 SUCESSO TOTAL: Reversão funcionando perfeitamente!');
      console.log('✅ Saldo atualizado corretamente na reversão');
    } else {
      console.log('\n❌ ERRO: Reversão não atualizou o saldo corretamente');
      console.log(`Diferença no saldo: R$ ${balanceFinal.current_balance - balanceInitial.current_balance}`);
      console.log(`Diferença no movimento: R$ ${balanceFinal.total_movements - balanceInitial.total_movements}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testReversePayment();