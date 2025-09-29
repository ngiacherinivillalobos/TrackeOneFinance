// Teste do saldo atual considerando apenas transações pagas com conta corrente
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

async function testBankAccountBalance() {
  try {
    console.log('🧪 Testando saldo de conta bancária (apenas pagamentos conta corrente)...');
    
    // 1. Verificar contas bancárias disponíveis
    console.log('\n1. Verificando contas bancárias...');
    
    const accountsResponse = await makeRequest(`${baseURL}/api/bank-accounts`);
    
    if (!accountsResponse.ok) {
      throw new Error(`Erro ao buscar contas: ${accountsResponse.status}`);
    }
    
    const accounts = accountsResponse.data;
    console.log('Contas disponíveis:', accounts.map(a => ({
      id: a.id, 
      name: a.name, 
      balance: a.balance
    })));
    
    if (accounts.length === 0) {
      console.log('❌ Nenhuma conta bancária encontrada');
      return;
    }
    
    const testAccount = accounts[0];
    console.log('✅ Conta para teste:', testAccount);
    
    // 2. Criar duas transações: uma paga com conta corrente e outra com cartão
    console.log('\n2. Criando transações de teste...');
    
    // Transação 1: Receita paga com conta corrente (deve aparecer no saldo)
    const transaction1Data = {
      description: "Receita Teste Conta Corrente",
      amount: 500,
      type: "income",
      category_id: 7, // Empréstimo
      contact_id: 1,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      is_paid: false
    };
    
    const createResponse1 = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transaction1Data
    });
    
    if (!createResponse1.ok) {
      throw new Error(`Erro ao criar transação 1: ${createResponse1.status} - ${JSON.stringify(createResponse1.data)}`);
    }
    
    const transaction1 = createResponse1.data.transaction;
    console.log('✅ Transação 1 criada (receita):', transaction1.id);
    
    // Transação 2: Despesa paga com cartão (NÃO deve aparecer no saldo)
    const transaction2Data = {
      description: "Despesa Teste Cartão",
      amount: 300,
      type: "expense",
      category_id: 25, // Alimentação
      contact_id: 17,
      cost_center_id: 1,
      transaction_date: "2024-10-01",
      is_paid: false
    };
    
    const createResponse2 = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transaction2Data
    });
    
    if (!createResponse2.ok) {
      throw new Error(`Erro ao criar transação 2: ${createResponse2.status} - ${JSON.stringify(createResponse2.data)}`);
    }
    
    const transaction2 = createResponse2.data.transaction;
    console.log('✅ Transação 2 criada (despesa):', transaction2.id);
    
    // 3. Verificar saldo ANTES dos pagamentos
    console.log('\n3. Verificando saldo ANTES dos pagamentos...');
    
    const balanceBeforeResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    
    if (!balanceBeforeResponse.ok) {
      throw new Error(`Erro ao buscar saldo: ${balanceBeforeResponse.status}`);
    }
    
    const balanceBefore = balanceBeforeResponse.data;
    console.log('💰 Saldo ANTES:', {
      initial_balance: balanceBefore.initial_balance,
      current_balance: balanceBefore.current_balance,
      total_movements: balanceBefore.total_movements
    });
    
    // 4. Marcar transação 1 como paga com CONTA CORRENTE
    console.log('\n4. Marcando transação 1 como paga com CONTA CORRENTE...');
    
    const payment1Data = {
      payment_date: "2024-10-01",
      paid_amount: 500,
      payment_type: "bank_account", // CONTA CORRENTE
      bank_account_id: testAccount.id,
      observations: "Pago via conta corrente"
    };
    
    const payment1Response = await makeRequest(`${baseURL}/api/transactions/${transaction1.id}/mark-as-paid`, {
      method: 'POST',
      body: payment1Data
    });
    
    if (!payment1Response.ok) {
      throw new Error(`Erro ao marcar transação 1 como paga: ${payment1Response.status} - ${JSON.stringify(payment1Response.data)}`);
    }
    
    console.log('✅ Transação 1 marcada como paga (conta corrente)');
    
    // 5. Marcar transação 2 como paga com CARTÃO DE CRÉDITO
    console.log('\n5. Marcando transação 2 como paga com CARTÃO...');
    
    const payment2Data = {
      payment_date: "2024-10-01",
      paid_amount: 300,
      payment_type: "credit_card", // CARTÃO
      card_id: 5,
      observations: "Pago via cartão de crédito"
    };
    
    const payment2Response = await makeRequest(`${baseURL}/api/transactions/${transaction2.id}/mark-as-paid`, {
      method: 'POST',
      body: payment2Data
    });
    
    if (!payment2Response.ok) {
      throw new Error(`Erro ao marcar transação 2 como paga: ${payment2Response.status} - ${JSON.stringify(payment2Response.data)}`);
    }
    
    console.log('✅ Transação 2 marcada como paga (cartão)');
    
    // 6. Verificar saldo APÓS os pagamentos
    console.log('\n6. Verificando saldo APÓS os pagamentos...');
    
    const balanceAfterResponse = await makeRequest(`${baseURL}/api/bank-accounts/${testAccount.id}/balance`);
    
    if (!balanceAfterResponse.ok) {
      throw new Error(`Erro ao buscar saldo: ${balanceAfterResponse.status}`);
    }
    
    const balanceAfter = balanceAfterResponse.data;
    console.log('💰 Saldo APÓS:', {
      initial_balance: balanceAfter.initial_balance,
      current_balance: balanceAfter.current_balance,
      total_movements: balanceAfter.total_movements
    });
    
    // 7. Validar resultados
    console.log('\n7. Validando resultados...');
    
    const expectedMovement = 500; // Apenas a receita paga com conta corrente
    const actualMovement = balanceAfter.total_movements - balanceBefore.total_movements;
    
    console.log('📊 Análise dos movimentos:');
    console.log(`• Receita paga com conta corrente: +${transaction1Data.amount}`);
    console.log(`• Despesa paga com cartão: ${transaction2Data.amount} (NÃO deve afetar saldo)`);
    console.log(`• Movimento esperado: +${expectedMovement}`);
    console.log(`• Movimento real: +${actualMovement}`);
    
    if (actualMovement === expectedMovement) {
      console.log('✅ SUCESSO: Saldo considera apenas transações pagas com conta corrente!');
    } else {
      console.log(`❌ ERRO: Movimento incorreto. Esperado: +${expectedMovement}, Recebido: +${actualMovement}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testBankAccountBalance();