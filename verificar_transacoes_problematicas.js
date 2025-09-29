// Script para corrigir transações existentes pagas com cartão que ainda têm bank_account_id
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

async function corrigirTransacoesExistentes() {
  try {
    console.log('🔧 Verificando transações existentes com problemas...');
    
    // 1. Buscar todas as transações
    const response = await makeRequest(`${baseURL}/api/transactions`);
    const transactions = response.data;
    
    console.log(`Total de transações: ${transactions.length}`);
    
    // 2. Identificar transações problemáticas
    const problematicas = transactions.filter(t => {
      // Transações pagas com cartão que ainda têm bank_account_id
      return t.payment_type === 'credit_card' && 
             (t.is_paid || t.payment_status_id === 2) && 
             t.bank_account_id !== null && 
             t.bank_account_id !== undefined;
    });
    
    console.log(`🚨 Transações problemáticas encontradas: ${problematicas.length}`);
    
    if (problematicas.length > 0) {
      console.log('\n📋 Detalhes das transações problemáticas:');
      problematicas.forEach((t, index) => {
        console.log(`${index + 1}. ID: ${t.id} - ${t.description}`);
        console.log(`   Valor: R$ ${t.amount}`);
        console.log(`   Payment Type: ${t.payment_type}`);
        console.log(`   Bank Account ID: ${t.bank_account_id} ❌ (deveria ser NULL)`);
        console.log(`   Card ID: ${t.card_id}`);
        console.log('');
      });
      
      console.log('💡 Essas transações estão causando o problema no saldo!');
      console.log('🔧 Elas precisam ter bank_account_id = NULL para não afetar o saldo da conta corrente.');
    } else {
      console.log('✅ Nenhuma transação problemática encontrada.');
    }
    
    // 3. Verificar também transações com payment_type indefinido
    const indefinidas = transactions.filter(t => {
      return (t.is_paid || t.payment_status_id === 2) && 
             t.payment_type === undefined && 
             t.bank_account_id !== null && 
             t.bank_account_id !== undefined;
    });
    
    if (indefinidas.length > 0) {
      console.log(`\n⚠️  Transações pagas sem payment_type definido: ${indefinidas.length}`);
      console.log('💡 Essas também podem estar afetando o saldo incorretamente.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

corrigirTransacoesExistentes();