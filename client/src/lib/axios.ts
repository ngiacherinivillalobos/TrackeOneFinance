import axios from 'axios';

// Configuração da URL base da API
const baseURL = import.meta.env.PROD 
  ? 'https://trackeone-finance-api.onrender.com/api'  // URL do Render em produção
  : 'http://localhost:3001/api';  // URL local em desenvolvimento - CORRIGIDO para porta 3001

// Criar instância do axios
const api = axios.create({
  baseURL,
  timeout: 15000, // 15 segundos de timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('❌ API Error:', error.response?.data || error.message);
    console.log('Detalhes do erro:', error.response || error);
    
    // Se o erro for 401 (não autorizado), redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;