// Teste para validar a correção da lógica de vencimento
// Caso: fechamento=10, vencimento=15, pagamento=29/09 → vencimento deve ser 15/10

const https = require('https');
const http = require('http');
const { URL } = require('url');

const baseURL = 'https://trackeone-finance-api.onrender.com';

// Token JWT válido (substitua pelo seu token)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcyNzY0Nzk2MywiZXhwIjoxNzI3NzM0MzYzfQ.G7K-s5Edc7xmKLzLQ-9sSZJYBr06ILm8eMdxYx7mQ6I';

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

async function testDueDateLogic() {
  try {
    console.log('🧪 Testando lógica de vencimento...');
    
    // 1. Primeiro vamos verificar se existe um cartão com as especificações
    console.log('\n1. Verificando cartão com fechamento=10 e vencimento=15...');
    
    const cardsResponse = await makeRequest(`${baseURL}/api/cards`);
    
    if (!cardsResponse.ok) {
      throw new Error(`Erro ao buscar cartões: ${cardsResponse.status}`);
    }
    
    const cards = cardsResponse.data;
    console.log('Cartões disponíveis:', cards.map(c => ({
      id: c.id, 
      name: c.name, 
      closing_day: c.closing_day, 
      due_day: c.due_day
    })));
    
    // Procurar cartão com fechamento=10 e vencimento=15
    let testCard = cards.find(c => c.closing_day === 10 && c.due_day === 15);
    
    if (!testCard) {
      console.log('Cartão não encontrado. Criando cartão de teste...');
      const createCardResponse = await makeRequest(`${baseURL}/api/cards`, {
        method: 'POST',
        body: {
          name: 'Cartão Teste Vencimento',
          limit: 5000,
          closing_day: 10,
          due_day: 15,
          observations: 'Cartão criado para teste de vencimento'
        }
      });
      
      if (createCardResponse.ok) {
        testCard = createCardResponse.data;
        console.log('✅ Cartão criado:', testCard);
      } else {
        throw new Error('Erro ao criar cartão de teste');
      }
    } else {
      console.log('✅ Cartão encontrado:', testCard);
    }
    
    // 2. Verificar transações disponíveis
    console.log('\n2. Verificando transações disponíveis...');
    
    const transactionsResponse = await makeRequest(`${baseURL}/api/transactions`);
    
    if (!transactionsResponse.ok) {
      throw new Error(`Erro ao buscar transações: ${transactionsResponse.status}`);
    }
    
    const transactions = transactionsResponse.data;
    const unpaidTransactions = transactions.filter(t => !t.is_paid);
    
    if (unpaidTransactions.length === 0) {
      console.log('❌ Nenhuma transação não paga encontrada');
      return;
    }
    
    const testTransaction = unpaidTransactions[0];
    console.log('✅ Transação para teste:', {
      id: testTransaction.id,
      description: testTransaction.description,
      amount: testTransaction.amount,
      is_paid: testTransaction.is_paid
    });
    
    // 3. Marcar como pago com cartão de crédito na data 29/09/2024
    console.log('\n3. Marcando transação como paga com cartão (29/09/2024)...');
    
    const paymentData = {
      is_paid: true,
      payment_date: '2024-09-29',
      paid_amount: testTransaction.amount,
      payment_type: 'credit_card',
      card_id: testCard.id,
      payment_observations: 'Teste de vencimento - pagamento em 29/09'
    };
    
    console.log('Dados do pagamento:', paymentData);
    
    const markAsPaidResponse = await makeRequest(`${baseURL}/api/transactions/${testTransaction.id}/mark-as-paid`, {
      method: 'PUT',
      body: paymentData
    });
    
    if (!markAsPaidResponse.ok) {
      throw new Error(`Erro ao marcar como pago: ${markAsPaidResponse.status} - ${JSON.stringify(markAsPaidResponse.data)}`);
    }
    
    const markAsPaidResult = markAsPaidResponse.data;
    console.log('✅ Transação marcada como paga:', markAsPaidResult);
    
    // 4. Verificar se a transação foi criada no cartão com vencimento correto
    console.log('\n4. Verificando transação criada no cartão...');
    
    const cardTransactionsResponse = await makeRequest(`${baseURL}/api/credit-card-transactions`);
    
    if (!cardTransactionsResponse.ok) {
      throw new Error(`Erro ao buscar transações do cartão: ${cardTransactionsResponse.status}`);
    }
    
    const cardTransactions = cardTransactionsResponse.data;
    
    // Procurar a transação criada automaticamente
    const createdTransaction = cardTransactions.find(ct => 
      ct.card_id === testCard.id && 
      ct.payment_observations && 
      ct.payment_observations.includes(`transação #${testTransaction.id}`)
    );
    
    if (createdTransaction) {
      console.log('✅ Transação encontrada no cartão:', {
        id: createdTransaction.id,
        description: createdTransaction.description,
        transaction_date: createdTransaction.transaction_date,
        due_date: createdTransaction.due_date,
        amount: createdTransaction.amount
      });
      
      // Validar a data de vencimento
      if (createdTransaction.due_date === '2024-10-15') {
        console.log('✅ SUCESSO: Data de vencimento correta (15/10/2024)');
      } else {
        console.log(`❌ ERRO: Data de vencimento incorreta. Esperado: 2024-10-15, Recebido: ${createdTransaction.due_date}`);
      }
    } else {
      console.log('❌ Transação não encontrada no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testDueDateLogic();