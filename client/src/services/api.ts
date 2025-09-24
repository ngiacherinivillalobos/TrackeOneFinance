import axios from 'axios';

// Usar a mesma lógica do lib/axios.ts para consistência
const getBaseURL = () => {
  // Em produção, tentar detectar a URL do backend
  if (import.meta.env.MODE === 'production') {
    // Usar a variável de ambiente VITE_API_URL se definida
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // Fallback para uma URL padrão - deve ser substituída pela URL real do Render
    return 'https://trackeone-finance-api.onrender.com';
  }
  // Em desenvolvimento, usar caminho relativo para o proxy do Vite
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // Aumentado para 60 segundos para dar tempo ao serviço acordar no Render
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Importante para CORS em desenvolvimento
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Garantir que todas as URLs comecem com /api, mas evitar duplicação
    // Verificar se a baseURL já contém /api para evitar duplicação
    const baseURLContainsAPI = config.baseURL?.includes('/api');
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http') && !baseURLContainsAPI) {
      config.url = `/api${config.url}`;
    }
    
    return config;
  },
  error => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('❌ API Error:', error);
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status diferente de 2xx
      console.error('Detalhes do erro:', {
        data: error.response.data,
        status: error.response.status
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor - verificar CORS e status do backend');
      console.error('URL tentada:', error.config?.baseURL + error.config?.url);
    } else {
      // Algo aconteceu na configuração da requisição que causou o erro
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;