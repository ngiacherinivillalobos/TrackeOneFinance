const axios = require('axios');

// Testar as rotas de categorias e subcategorias
const testCategories = async () => {
  try {
    console.log('Testando conexão com o servidor...');
    
    // Testar endpoint de teste
    const testResponse = await axios.get('http://localhost:3001/api/test');
    console.log('✅ Endpoint de teste:', testResponse.data);
    
    // Testar endpoint de health check
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Testar endpoint de categorias
    console.log('\nTestando categorias...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories', {
      timeout: 10000 // 10 segundos de timeout
    });
    console.log('✅ Categorias carregadas:', categoriesResponse.data.length, 'registros');
    console.log('Primeiras 3 categorias:', categoriesResponse.data.slice(0, 3));
    
    // Testar endpoint de subcategorias
    console.log('\nTestando subcategorias...');
    const subcategoriesResponse = await axios.get('http://localhost:3001/api/subcategories', {
      timeout: 10000 // 10 segundos de timeout
    });
    console.log('✅ Subcategorias carregadas:', subcategoriesResponse.data.length, 'registros');
    console.log('Primeiras 3 subcategorias:', subcategoriesResponse.data.slice(0, 3));
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
};

testCategories();