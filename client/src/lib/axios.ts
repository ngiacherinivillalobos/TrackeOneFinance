import axios from 'axios';

// Detectar a URL base automaticamente com base no ambiente
const getBaseURL = () => {
  // Em produção, usar a URL do backend no Render sem '/api' no final
  if (import.meta.env.MODE === 'production') {
    return 'https://trackeone-finance-api.onrender.com';
  }
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3001';
};

const baseURL = getBaseURL();

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging and token management
api.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Verificar se o token está próximo da expiração (menos de 1 dia)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        // Se o token expirar em menos de 1 dia, tentar renovar
        if (exp - now < 86400) {
          console.log('Token próximo da expiração, tentando renovar...');
          try {
            const response = await axios.post(`${config.baseURL}/api/auth/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const { token: newToken } = response.data;
            if (newToken) {
              localStorage.setItem('token', newToken);
              config.headers['Authorization'] = `Bearer ${newToken}`;
              console.log('Token renovado com sucesso');
            }
          } catch (error) {
            console.error('Erro ao renovar token:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
    
    // Certificar-se de que a URL comece com /api para todas as requisições
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `/api${config.url}`;
    }
    
    console.log(`🚀 Axios Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and handling 401 errors
api.interceptors.response.use(
  response => {
    console.log(`✅ Axios Response: ${response.config.url} - Status: ${response.status}, Data length:`, Array.isArray(response.data) ? response.data.length : 'não é array');
    return response;
  },
  async error => {
    console.error('❌ Axios Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Se o erro for 401 (não autorizado), tentar renovar o token
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.post(`${error.config?.baseURL || baseURL}/api/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const { token: newToken } = response.data;
          if (newToken) {
            localStorage.setItem('token', newToken);
            // Repetir a requisição original com o novo token
            const originalRequest = error.config;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api.request(originalRequest);
          }
        } catch (refreshError) {
          console.error('Erro ao renovar token:', refreshError);
        }
      }
      
      // Remover token do localStorage se a renovação falhar
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

export default api;