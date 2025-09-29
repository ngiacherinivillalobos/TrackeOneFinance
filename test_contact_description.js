// Teste da nova funcionalidade: descrição com contato entre parênteses
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

async function testContactInDescription() {
  try {
    console.log('🧪 Testando descrição com contato entre parênteses...');
    
    // 1. Criar uma transação de teste
    console.log('\n1. Criando transação de teste...');
    
    const transactionData = {
      description: "Alimentação Natural",
      amount: 150,
      type: "expense",
      category_id: 25, // Alimentação
      contact_id: 17, // Dog Food Natural
      cost_center_id: 1,
      transaction_date: "2024-09-30",
      due_date: "2024-10-05",
      is_paid: false
    };
    
    const createResponse = await makeRequest(`${baseURL}/api/transactions`, {
      method: 'POST',
      body: transactionData
    });
    
    if (!createResponse.ok) {
      throw new Error(`Erro ao criar transação: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`);
    }
    
    const transaction = createResponse.data.transaction;
    console.log('✅ Transação criada:', {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount
    });
    
    // 2. Marcar como pago com cartão de crédito
    console.log('\n2. Marcando como pago com cartão...');
    
    const paymentData = {
      payment_date: "2024-09-30",
      paid_amount: 150,
      payment_type: "credit_card",
      card_id: 5, // Cartão teste com fechamento=10, vencimento=15
      observations: "Teste descrição com contato"
    };
    
    const paymentResponse = await makeRequest(`${baseURL}/api/transactions/${transaction.id}/mark-as-paid`, {
      method: 'POST',
      body: paymentData
    });
    
    if (!paymentResponse.ok) {
      throw new Error(`Erro ao marcar como pago: ${paymentResponse.status} - ${JSON.stringify(paymentResponse.data)}`);
    }
    
    console.log('✅ Transação marcada como paga');
    
    // 3. Verificar transação criada no cartão
    console.log('\n3. Verificando transação criada no cartão...');
    
    const cardTransactionsResponse = await makeRequest(`${baseURL}/api/credit-card-transactions`);
    
    if (!cardTransactionsResponse.ok) {
      throw new Error(`Erro ao buscar transações do cartão: ${cardTransactionsResponse.status}`);
    }
    
    const cardTransactions = cardTransactionsResponse.data;
    
    // Procurar a transação criada automaticamente
    const createdTransaction = cardTransactions.find(ct => 
      ct.card_id === 5 && 
      ct.payment_observations && 
      ct.payment_observations.includes(`transação #${transaction.id}`)
    );
    
    if (createdTransaction) {
      console.log('✅ Transação encontrada no cartão:', {
        id: createdTransaction.id,
        description: createdTransaction.description,
        transaction_date: createdTransaction.transaction_date,
        due_date: createdTransaction.due_date,
        amount: createdTransaction.amount
      });
      
      // Validar a descrição com contato entre parênteses
      const expectedDescription = "Pagamento: Alimentação Natural (Dog Food Natural)";
      if (createdTransaction.description === expectedDescription) {
        console.log('✅ SUCESSO: Descrição com contato entre parênteses está correta!');
        console.log(`📝 Descrição: "${createdTransaction.description}"`);
      } else {
        console.log(`❌ ERRO: Descrição incorreta.`);
        console.log(`📝 Esperado: "${expectedDescription}"`);
        console.log(`📝 Recebido: "${createdTransaction.description}"`);
      }
      
      // Validar vencimento
      if (createdTransaction.due_date === '2024-10-15') {
        console.log('✅ Data de vencimento correta (15/10/2024)');
      } else {
        console.log(`⚠️ Data de vencimento: ${createdTransaction.due_date}`);
      }
    } else {
      console.log('❌ Transação não encontrada no cartão');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testContactInDescription();