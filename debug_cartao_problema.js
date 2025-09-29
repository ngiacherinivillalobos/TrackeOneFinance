// DEBUG ULTRA AGRESSIVO: Encontrar exatamente onde está o problema
const http = require('http');

const baseURL = 'http://localhost:3001';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImVtYWlsIjoidGVzdDJAZXhhbXBsZS5jb20iLCJjb3N0X2NlbnRlcl9pZCI6bnVsbCwiaWF0IjoxNzU5MTcxMjc3LCJleHAiOjE3NjE3NjMyNzd9.PCb14cGrmtvjK0zgF-EGravY40Ql1Jkny3svmhJKfiU';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Data: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function debugProblema() {
  try {
    console.log('🚨 DEBUG ULTRA AGRESSIVO: Encontrando o problema...');
    
    // 1. Pegar dados
    const accounts = await request('/api/bank-accounts');
    const cards = await request('/api/cards');
    const account = accounts[0];
    const card = cards[0];
    
    console.log(`Conta: ${account.name} (ID: ${account.id})`);
    console.log(`Cartão: ${card.name} (ID: ${card.id})`);
    
    // 2. Saldo ANTES
    const balanceBefore = await request(`/api/bank-accounts/${account.id}/balance`);
    console.log(`\n💰 SALDO ANTES: R$ ${balanceBefore.current_balance}`);
    
    // 3. Criar transação
    console.log('\n📝 Criando transação de R$ 5.000...');
    const transaction = await request('/api/transactions', {
      method: 'POST',
      body: {
        description: "DEBUG: Transação R$ 5.000",
        amount: 5000,
        type: "expense",
        category_id: 25,
        contact_id: 17,
        cost_center_id: 1,
        transaction_date: "2024-10-01",
        bank_account_id: account.id,
        is_paid: false
      }
    });
    
    const transactionId = transaction.transaction.id;
    console.log(`✅ Transação criada (ID: ${transactionId})`);
    
    // 4. Marcar como paga com CARTÃO
    console.log('\n💳 Marcando como paga com CARTÃO...');
    await request(`/api/transactions/${transactionId}/mark-as-paid`, {
      method: 'POST',
      body: {
        payment_date: "2024-10-01",
        paid_amount: 5000,
        payment_type: "credit_card",
        card_id: card.id,
        observations: "DEBUG: Pago com cartão - NÃO deve afetar saldo"
      }
    });
    
    console.log('✅ Marcada como paga com cartão');
    
    // 5. Buscar transação atualizada
    const updatedTransaction = await request(`/api/transactions/${transactionId}`);
    console.log('\n🔍 Dados da transação após pagamento:');
    console.log(`   Payment Type: ${updatedTransaction.payment_type}`);
    console.log(`   Bank Account ID: ${updatedTransaction.bank_account_id}`);
    console.log(`   Card ID: ${updatedTransaction.card_id}`);
    console.log(`   Is Paid: ${updatedTransaction.is_paid}`);
    
    // 6. Saldo DEPOIS
    const balanceAfter = await request(`/api/bank-accounts/${account.id}/balance`);
    console.log(`\n💰 SALDO DEPOIS: R$ ${balanceAfter.current_balance}`);
    
    // 7. ANÁLISE CRÍTICA
    const diferenca = balanceBefore.current_balance - balanceAfter.current_balance;
    console.log(`\n📊 ANÁLISE:`)
    console.log(`   Valor da transação: R$ 5.000`);
    console.log(`   Saldo antes: R$ ${balanceBefore.current_balance}`);
    console.log(`   Saldo depois: R$ ${balanceAfter.current_balance}`);
    console.log(`   Diferença: R$ ${diferenca}`);
    
    if (diferenca === 0) {
      console.log('\n✅ CORRETO: Cartão NÃO afetou saldo');
    } else {
      console.log('\n❌ PROBLEMA CONFIRMADO!');
      console.log(`🚨 Transação com payment_type = '${updatedTransaction.payment_type}' afetou o saldo`);
      console.log('🔧 Verificar se:');
      console.log('   1. payment_type está sendo salvo corretamente');
      console.log('   2. Query SQL está filtrando corretamente');
      console.log('   3. bank_account_id não deveria estar preenchido');
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugProblema();