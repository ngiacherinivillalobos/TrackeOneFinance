// TESTE DIRETO E RÁPIDO
const https = require('https');
const http = require('http');
const { URL } = require('url');

const baseURL = 'http://localhost:3001';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoidGVzdDJAZXhhbXBsZS5jb20iLCJjb3N0X2NlbnRlcl9pZCI6bnVsbCwiaWF0IjoxNzU5MTcxMjc3LCJleHAiOjE3NjE3NjMyNzd9.PCb14cGrmtvjK0zgF-EGravY40Ql1Jkny3svmhJKfiU';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: 3001,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(data), status: res.statusCode });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function testeDireto() {
  try {
    console.log('🚀 TESTE DIRETO...');
    
    // Pegar conta
    const accountsResp = await makeRequest(`${baseURL}/api/bank-accounts`);
    const account = accountsResp.data[0];
    console.log(`Conta: ${account.name}`);
    
    // Saldo antes
    const balanceBefore = await makeRequest(`${baseURL}/api/bank-accounts/${account.id}/balance`);
    console.log(`Saldo ANTES: R$ ${balanceBefore.data.current_balance}`);
    
    // Criar despesa
    const transaction = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: {
        description: "Teste Direto",
        amount: 1000,
        type: "expense",
        category_id: 25,
        contact_id: 17,
        cost_center_id: 1,
        transaction_date: "2024-10-01",
        bank_account_id: account.id,
        is_paid: false
      }
    });
    
    console.log(`Despesa criada: R$ 1000 (ID: ${transaction.data.transaction.id})`);
    
    // Pegar cartão
    const cards = await makeRequest(`${baseURL}/api/cards`);
    const card = cards.data[0];
    
    // Marcar como paga com CARTÃO
    await makeRequest(`${baseURL}/api/transactions/${transaction.data.transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: {
        payment_date: "2024-10-01",
        paid_amount: 1000,
        payment_type: "credit_card",
        card_id: card.id,
        observations: "Teste direto com cartão"
      }
    });
    
    console.log('✅ Marcada como paga com CARTÃO');
    
    // Saldo depois
    const balanceAfter = await makeRequest(`${baseURL}/api/bank-accounts/${account.id}/balance`);
    console.log(`Saldo DEPOIS: R$ ${balanceAfter.data.current_balance}`);
    
    // Verificar
    const diferenca = balanceBefore.data.current_balance - balanceAfter.data.current_balance;
    console.log(`Diferença: R$ ${diferenca}`);
    
    if (diferenca === 0) {
      console.log('✅ CORRETO! Cartão NÃO afetou saldo');
    } else {
      console.log('❌ ERRO! Cartão afetou saldo incorretamente');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testeDireto();