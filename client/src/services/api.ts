import axios from 'axios';

// Detectar a URL base automaticamente com base no ambiente
const getBaseURL = () => {
  // Em produção, usar a URL do backend no Render
  if (import.meta.env.MODE === 'production') {
    // Usar a variável de ambiente VITE_API_URL se definida, senão usar padrão
    return import.meta.env.VITE_API_URL || 'https://trackeone-finance-api.onrender.com/api';
  }
  // Em desenvolvimento, usar URL absoluta para o backend
  return 'http://localhost:3001/api';
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
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
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
    } else {
      // Algo aconteceu na configuração da requisição que causou o erro
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;