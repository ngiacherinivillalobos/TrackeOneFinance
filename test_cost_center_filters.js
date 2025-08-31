const axios = require('axios');

// Testar os filtros de centro de custo
async function testCostCenterFilters() {
  try {
    console.log('=== Testando Filtros de Centro de Custo ===\n');
    
    // Testar filtro com um centro de custo
    console.log('1. Testando filtro com um centro de custo...');
    const response1 = await axios.get('http://localhost:3001/api/transactions', {
      params: {
        cost_center_id: '1'
      }
    });
    console.log(`   Resultados encontrados: ${response1.data.length}`);
    
    // Testar filtro com múltiplos centros de custo
    console.log('\n2. Testando filtro com múltiplos centros de custo...');
    const response2 = await axios.get('http://localhost:3001/api/transactions', {
      params: {
        cost_center_id: '1,2'
      }
    });
    console.log(`   Resultados encontrados: ${response2.data.length}`);
    
    // Testar filtro com todos os centros de custo
    console.log('\n3. Testando filtro sem centro de custo específico (todos)...');
    const response3 = await axios.get('http://localhost:3001/api/transactions');
    console.log(`   Resultados encontrados: ${response3.data.length}`);
    
    console.log('\n=== Testes concluídos com sucesso! ===');
  } catch (error) {
    console.error('Erro durante os testes:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Testar os filtros de centro de custo no Cash Flow
async function testCashFlowFilters() {
  try {
    console.log('\n=== Testando Filtros de Centro de Custo no Cash Flow ===\n');
    
    // Testar filtro com um centro de custo
    console.log('1. Testando filtro com um centro de custo no Cash Flow...');
    const response1 = await axios.get('http://localhost:3001/api/cash-flow', {
      params: {
        cost_center_id: '1'
      }
    });
    console.log(`   Resultados encontrados: ${response1.data.length}`);
    
    // Testar filtro com múltiplos centros de custo
    console.log('\n2. Testando filtro com múltiplos centros de custo no Cash Flow...');
    const response2 = await axios.get('http://localhost:3001/api/cash-flow', {
      params: {
        cost_center_id: '1,2'
      }
    });
    console.log(`   Resultados encontrados: ${response2.data.length}`);
    
    console.log('\n=== Testes do Cash Flow concluídos! ===');
  } catch (error) {
    console.error('Erro durante os testes do Cash Flow:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar os testes
async function runTests() {
  await testCostCenterFilters();
  await testCashFlowFilters();
}

runTests();