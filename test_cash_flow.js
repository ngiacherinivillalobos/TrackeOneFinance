const axios = require('axios');

// Testar o endpoint do fluxo de caixa
async function testCashFlow() {
  try {
    console.log('=== Teste do Fluxo de Caixa ===\n');
    
    // Primeiro fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('https://trackeone-finance-api.onrender.com/api/auth/login', {
      email: 'admin@trackone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido\n');
    
    // Criar alguns registros de teste
    console.log('Criando registros de teste...');
    const testRecords = [
      {
        date: '2025-09-01',
        description: 'Teste Receita',
        amount: 1000.50,
        record_type: 'Receita',
        cost_center_id: 1
      },
      {
        date: '2025-09-02',
        description: 'Teste Despesa',
        amount: 500.25,
        record_type: 'Despesa',
        cost_center_id: 1
      }
    ];
    
    for (const record of testRecords) {
      try {
        await axios.post('https://trackeone-finance-api.onrender.com/api/cash-flow', record, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ Registro criado: ${record.description}`);
      } catch (createError) {
        console.log(`❌ Erro ao criar registro ${record.description}: ${createError.message}`);
      }
    }
    
    console.log('\nAguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar o endpoint do fluxo de caixa
    console.log('Testando endpoint do fluxo de caixa para 9/2025...');
    const cashFlowResponse = await axios.get('https://trackeone-finance-api.onrender.com/api/cash-flow?month=9&year=2025', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Registros encontrados: ${cashFlowResponse.data.length}`);
    
    // Verificar se há registros e examinar os valores
    if (cashFlowResponse.data.length > 0) {
      console.log('\nExaminando os registros:');
      cashFlowResponse.data.forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}, Descrição: ${record.description}, Valor: ${record.amount}, Tipo: ${record.record_type}`);
        console.log(`   Tipo do valor: ${typeof record.amount}`);
      });
      
      // Calcular totalizadores com tratamento defensivo
      const totalReceitas = cashFlowResponse.data
        .filter(r => r.record_type === 'Receita')
        .reduce((sum, r) => {
          const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount;
          const validAmount = isNaN(amount) ? 0 : amount;
          console.log(`Receita: ${r.description} - Valor original: ${r.amount} - Valor convertido: ${validAmount}`);
          return sum + validAmount;
        }, 0);
        
      const totalDespesas = cashFlowResponse.data
        .filter(r => r.record_type === 'Despesa')
        .reduce((sum, r) => {
          const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount;
          const validAmount = isNaN(amount) ? 0 : amount;
          console.log(`Despesa: ${r.description} - Valor original: ${r.amount} - Valor convertido: ${validAmount}`);
          return sum + validAmount;
        }, 0);
        
      console.log(`\nTotal de receitas: ${totalReceitas}`);
      console.log(`Total de despesas: ${totalDespesas}`);
      console.log(`Saldo: ${totalReceitas - totalDespesas}`);
      
      // Verificar se os totalizadores são números válidos
      if (isNaN(totalReceitas) || isNaN(totalDespesas)) {
        console.log('❌ ERRO: Totalizadores são NaN!');
      } else {
        console.log('✅ Totalizadores calculados corretamente');
      }
    } else {
      console.log('Nenhum registro encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Executar o teste
testCashFlow();