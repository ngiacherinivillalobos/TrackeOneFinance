import axios from 'axios';

// Configuração da URL base da API
// Em desenvolvimento, usar caminho relativo para o proxy do Vite
// Em produção, usar a variável de ambiente ou URL padrão
const baseURL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://trackeone-finance-api.onrender.com')
  : '/api';  // Usar proxy do Vite em desenvolvimento

console.log('🔧 Axios baseURL configurado:', baseURL);

// Criar instância do axios
const api = axios.create({
  baseURL,
  timeout: 30000, // Aumentar timeout para 30 segundos
  headers: {
    'Content-Type': 'application/json'
  },
  // Adicionar withCredentials para desenvolvimento
  withCredentials: import.meta.env.DEV ? false : true
});

// Interceptor para adicionar token de autenticação automaticamente
api.interceptors.request.use(
  (config) => {
    console.log('📤 Axios Request:', config.method?.toUpperCase(), config.url);
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