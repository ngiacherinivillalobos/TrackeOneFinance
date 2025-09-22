const axios = require('axios');

// Testar as rotas de categorias e subcategorias com autenticação
const testAuthCategories = async () => {
  try {
    console.log('Testando login...');
    
    // Fazer login para obter token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    }, {
      timeout: 10000
    });
    
    console.log('✅ Login bem-sucedido');
    const token = loginResponse.data.token;
    console.log('Token obtido:', token.substring(0, 20) + '...');
    
    // Configurar headers de autenticação
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    };
    
    // Testar endpoint de categorias
    console.log('\nTestando categorias...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories', authHeaders);
    console.log('✅ Categorias carregadas:', categoriesResponse.data.length, 'registros');
    console.log('Primeiras 3 categorias:', categoriesResponse.data.slice(0, 3));
    
    // Testar endpoint de subcategorias
    console.log('\nTestando subcategorias...');
    const subcategoriesResponse = await axios.get('http://localhost:3001/api/subcategories', authHeaders);
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

testAuthCategories();