// Teste crítico: pagamento com cartão NÃO deve afetar saldo de conta corrente
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
      is_paid: false,
      bank_account_id: testAccount.id // IMPORTANTE: transação vinculada à conta
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    const transaction = createResponse.data.transaction;
    console.log('✅ Despesa criada (ID):', transaction.id);
    console.log('💡 Transação vinculada à conta:', testAccount.name);
    
    // 4. Marcar como paga com CARTÃO DE CRÉDITO
    console.log('\n💳 Marcando como paga com CARTÃO DE CRÉDITO...');
    console.log('🚨 CRÍTICO: Saldo da conta corrente NÃO deve mudar!');
    
    const paymentData = {
      payment_date: "2024-10-01",
      paid_amount: 1200,
      payment_type: "credit_card", // CARTÃO - NÃO DEVE AFETAR SALDO
      card_id: 5,
      observations: "Pago com cartão - saldo conta NÃO deve mudar"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    if (!paymentResponse.ok) {
      throw new Error(`Erro ao marcar como pago: ${paymentResponse.status} - ${JSON.stringify(paymentResponse.data)}`);
    }
    
    console.log('✅ Transação marcada como paga com cartão');
    
    // 5. Verificar transação atualizada
    console.log('\n🔍 Verificando dados da transação após pagamento...');
    
    const transactionAfterResponse = await makeRequest(`${baseURL}/api/transactions`);
    const transactions = transactionAfterResponse.data;
    const updatedTransaction = transactions.find(t => t.id === transaction.id);
    
    if (updatedTransaction) {
      console.log('📋 Transação após pagamento:', {
        id: updatedTransaction.id,
        description: updatedTransaction.description,
        payment_type: updatedTransaction.payment_type,
        bank_account_id: updatedTransaction.bank_account_id,
        card_id: updatedTransaction.card_id,
        is_paid: updatedTransaction.is_paid
      });
      
      // VERIFICAÇÃO CRÍTICA
      if (updatedTransaction.bank_account_id !== null) {
        console.log('❌ ERRO CRÍTICO: bank_account_id deveria ser NULL para pagamento com cartão!');
      } else {
        console.log('✅ Correto: bank_account_id é NULL para pagamento com cartão');
      }
    }
    
    // 6. Verificar saldo APÓS PAGAMENTO COM CARTÃO
    const balanceFinalResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    const balanceFinal = balanceFinalResponse.data;
    console.log('\n💰 Saldo APÓS pagamento com cartão:', {
      current_balance: balanceFinal.current_balance,
      total_movements: balanceFinal.total_movements
    });
    
    // 7. VALIDAÇÃO CRÍTICA
    const saldoMudou = balanceFinal.current_balance !== balanceInitial.current_balance;
    const movimentoMudou = balanceFinal.total_movements !== balanceInitial.total_movements;
    
    console.log('\n📊 ANÁLISE CRÍTICA:');
    console.log(`• Despesa R$ ${transactionData.amount} paga com CARTÃO`);
    console.log(`• Saldo inicial: R$ ${balanceInitial.current_balance}`);
    console.log(`• Saldo final: R$ ${balanceFinal.current_balance}`);
    console.log(`• Saldo mudou: ${saldoMudou ? 'SIM ❌ ERRO!' : 'NÃO ✅ CORRETO'}`);
    console.log(`• Movimento mudou: ${movimentoMudou ? 'SIM ❌ ERRO!' : 'NÃO ✅ CORRETO'}`);
    
    if (!saldoMudou && !movimentoMudou) {
      console.log('\n🎉 SUCESSO TOTAL: Pagamento com cartão NÃO afetou saldo da conta corrente!');
      console.log('✅ Lógica funcionando corretamente');
      console.log('✅ Saldo da conta corrente preservado');
    } else {
      console.log('\n🚨 FALHA CRÍTICA: Pagamento com cartão AFETOU saldo da conta corrente!');
      console.log('❌ Isso está ERRADO - cartão não deve mexer no saldo da conta');
      console.log(`Diferença no saldo: R$ ${balanceFinal.current_balance - balanceInitial.current_balance}`);
      console.log(`Diferença no movimento: R$ ${balanceFinal.total_movements - balanceInitial.total_movements}`);
    }
    
    // 8. Verificar se transação foi criada no cartão
    console.log('\n💳 Verificando se transação foi criada no cartão...');
    
    const cardTransactionsResponse = await makeRequest(`${baseURL}/api/credit-card-transactions`);
    const cardTransactions = cardTransactionsResponse.data;
    
    const createdInCard = cardTransactions.find(ct => 
      ct.card_id === 5 && 
      ct.payment_observations && 
      ct.payment_observations.includes(`transação #${transaction.id}`)
    );
    
    if (createdInCard) {
      console.log('✅ Transação criada corretamente no cartão:', {
        id: createdInCard.id,
        description: createdInCard.description,
        amount: createdInCard.amount,
        due_date: createdInCard.due_date
      });
    } else {
      console.log('❌ Transação NÃO foi criada no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testCartaoNaoAfetaSaldo();