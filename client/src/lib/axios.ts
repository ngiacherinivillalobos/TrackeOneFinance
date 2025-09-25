import axios from 'axios';

// Configuração da URL base da API
// FORÇAR o uso do proxy /api em TODOS os ambientes
const baseURL = '/api';

console.log('🔧 Axios baseURL configurado:', baseURL);
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Criar instância do axios
const api = axios.create({
  baseURL,
  timeout: 30000, // Aumentar timeout para 30 segundos
  headers: {
    'Content-Type': 'application/json'
  },
  // Sempre usar credenciais para permitir cookies de autenticação
  withCredentials: true
});

// FORCE baseURL correction in ALL requests
api.defaults.baseURL = '/api';

console.log('🔧 API instance created with baseURL:', api.defaults.baseURL);

// Interceptor para adicionar token de autenticação automaticamente
api.interceptors.request.use(
  (config) => {
    // FORÇAR SEMPRE /api - SEM EXCEÇÕES
    config.baseURL = '/api';
    
    // Verificar e corrigir qualquer URL absoluta - MODO AGRESSIVO
    if (config.url && (config.url.includes('trackeone-finance-api.onrender.com') || config.url.startsWith('https://') || config.url.includes('.onrender.com'))) {
      console.error('❌ ERRO CRÍTICO: URL absoluta detectada!', config.url);
      console.error('❌ Forçando correção AGRESSIVA...');
      
      // Extrair apenas o path da URL
      let cleanUrl = config.url;
      cleanUrl = cleanUrl.replace(/https:\/\/[^\/]*\.onrender\.com\/api/g, '');
      cleanUrl = cleanUrl.replace(/https:\/\/[^\/]*\.onrender\.com/g, '');
      cleanUrl = cleanUrl.replace(/https:\/\/[^\/]+/g, ''); // Remove qualquer domínio
      
      // Garantir que comece com /
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }
      
      config.url = cleanUrl;
      config.baseURL = '/api';
      console.log('✅ URL AGRESSIVAMENTE corrigida para:', config.url);
      console.log('✅ BaseURL AGRESSIVAMENTE corrigida para:', config.baseURL);
    }
    
    // Garantir que não há duplicação de /api
    if (config.url && config.url.startsWith('/api/api')) {
      config.url = config.url.replace('/api/api', '/api');
      console.log('✅ Removida duplicação /api/api para:', config.url);
    }
    
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('🚀 === AXIOS REQUEST DEBUG ===');
    console.log('📤 Method:', config.method?.toUpperCase());
    console.log('📤 BaseURL FINAL:', config.baseURL);
    console.log('📤 URL FINAL:', config.url);
    console.log('📤 Full URL FINAL:', fullUrl);
    console.log('📤 Environment:', import.meta.env.MODE);
    console.log('📤 VITE_API_URL:', import.meta.env.VITE_API_URL);
    
    // VERIFICAÇÃO FINAL - se ainda contém URL proibida, bloquear
    if (fullUrl.includes('trackeone-finance-api.onrender.com') || fullUrl.includes('.onrender.com')) {
      console.error('🚨 BLOQUEANDO REQUEST COM URL PROIBIDA:', fullUrl);
      throw new Error('URL absoluta bloqueada pelo interceptor de segurança');
    }
    
    console.log('🚀 === END AXIOS DEBUG ===');
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log('📥 Axios Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ API Error:', error.response?.data || error.message);
    console.log('Detalhes do erro:', error.response || error);
    
    // Tratar erros de timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Timeout ao conectar com o servidor. Verifique sua conexão e tente novamente.');
    }
    
    // Se o erro for 401 (não autorizado), redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Somente redirecionar se não estivermos já na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;