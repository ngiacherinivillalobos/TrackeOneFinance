import axios from 'axios';

// Detectar a URL base automaticamente com base no ambiente
const getBaseURL = () => {
  // Em produção, usar a URL do backend no Render sem '/api' no final
  if (import.meta.env.MODE === 'production') {
    console.log('Usando ambiente de produção');
    // Usar a variável de ambiente VITE_API_URL se definida, senão usar padrão
    return import.meta.env.VITE_API_URL || 'https://trackeone-finance-api.onrender.com';
  }
  // Em desenvolvimento, usar localhost
  console.log('Usando ambiente de desenvolvimento');
  return 'http://localhost:3001';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Remover a adição automática de /api pois o backend já o inclui
    // Apenas garantir que URLs absolutas não sejam modificadas
    if (config.url && config.url.startsWith('http')) {
      // Não modificar URLs absolutas
    } else if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('/')) {
      // Adicionar barra inicial se não houver
      config.url = `/${config.url}`;
    }
    
    console.log(`🚀 Axios Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
    console.log(`✅ Axios Response: ${response.config.url} - Status: ${response.status}, Data length:`, Array.isArray(response.data) ? response.data.length : 'não é array');
    return response;
  },
  error => {
    console.error('❌ Axios Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;