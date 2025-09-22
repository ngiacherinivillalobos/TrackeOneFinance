import api from '../lib/axios';

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Category API Response:', response);
    return response;
  },
  error => {
    console.error('Category API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Category {
  id?: number;
  name: string;
  source_type: string;
  created_at?: string;
}

export const categoryService = {
  list: async () => {
    console.log('Fetching categories...');
    try {
      const response = await api.get<Category[]>('/categories', {
        timeout: 30000 // Aumentar timeout para 30 segundos
      });
      console.log('Categories response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in categoryService.list:', error);
      // Tratar erros específicos
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo limite excedido ao carregar categorias. Por favor, tente novamente.');
      } else if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      } else if (error.response?.status === 500) {
        throw new Error('Erro no servidor ao carregar categorias. Tente novamente mais tarde.');
      } else {
        throw new Error('Erro ao carregar categorias: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  create: async (category: Omit<Category, 'id'>) => {
    try {
      const response = await api.post<Category>('/categories', category);
      return response.data;
    } catch (error: any) {
      console.error('Error in categoryService.create:', error);
      throw new Error('Erro ao criar categoria: ' + (error.response?.data?.error || error.message));
    }
  },

  update: async (id: number, category: Omit<Category, 'id'>) => {
    try {
      const response = await api.put<Category>(`/categories/${id}`, category);
      return response.data;
    } catch (error: any) {
      console.error('Error in categoryService.update:', error);
      throw new Error('Erro ao atualizar categoria: ' + (error.response?.data?.error || error.message));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      console.error('Error in categoryService.delete:', error);
      throw new Error('Erro ao excluir categoria: ' + (error.response?.data?.error || error.message));
    }
  }
};