import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/axios';

interface User {
  id: number;
  email: string;
  cost_center_id?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenCheckInterval, setTokenCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Função para validar o token com o servidor
  const validateToken = async (tokenToValidate: string) => {
    try {
      await api.get('/auth/validate');
      return true;
    } catch (error) {
      return false;
    }
  };

  // Função para renovar o token
  const renewToken = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Atualizar as informações do usuário a partir do novo token
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ 
          id: payload.id, 
          email: payload.email,
          cost_center_id: payload.cost_center_id
        });
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
    }
    return false;
  };

  // Inicializa o estado de autenticação ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Decodificar o token JWT para obter informações do usuário
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          setUser({ 
            id: payload.id, 
            email: payload.email,
            cost_center_id: payload.cost_center_id
          });
          setToken(storedToken);
          
          // Validar o token com o servidor
          const isValid = await validateToken(storedToken);
          if (!isValid) {
            // Tentar renovar o token se a validação falhar
            const renewed = await renewToken();
            if (!renewed) {
              // Se não conseguir renovar, fazer logout
              logout();
            }
          }
        } catch (error) {
          console.error('Erro ao decodificar token:', error);
          // Token inválido ou expirado, remover do localStorage
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    initializeAuth();
    
    // Configurar verificação periódica do token
    const interval = setInterval(async () => {
      if (token) {
        const isValid = await validateToken(token);
        if (!isValid) {
          const renewed = await renewToken();
          if (!renewed) {
            logout();
          }
        }
      }
    }, 30 * 60 * 1000); // Verificar a cada 30 minutos
    
    setTokenCheckInterval(interval);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [token]); // Adicionar token como dependência

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Decodificar o token para obter informações do usuário
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ 
          id: payload.id, 
          email: payload.email,
          cost_center_id: payload.cost_center_id
        });
      } else {
        throw new Error('Token não recebido');
      }
    } catch (error: any) {
      // Re-lançar o erro para ser tratado pelo componente
      throw new Error(error?.response?.data?.error || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    // Limpar o intervalo de verificação de token
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      setTokenCheckInterval(null);
    }
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};