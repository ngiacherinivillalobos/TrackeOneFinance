import api from '../lib/axios';

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Subcategory API Response:', response);
    return response;
  },
  error => {
    console.error('Subcategory API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Subcategory {
  id?: number;
  name: string;
  category_id: number;
  category_name?: string;
  created_at?: string;
}

export const subcategoryService = {
  async list(): Promise<Subcategory[]> {
    console.log('Fetching subcategories...');
    try {
      const response = await api.get('/subcategories', {
        timeout: 30000 // Aumentar timeout para 30 segundos
      });
      console.log('Subcategories response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in subcategoryService.list:', error);
      // Tratar erros específicos
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo limite excedido ao carregar subcategorias. Por favor, tente novamente.');
      } else if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      } else if (error.response?.status === 500) {
        throw new Error('Erro no servidor ao carregar subcategorias. Tente novamente mais tarde.');
      } else {
        throw new Error('Erro ao carregar subcategorias: ' + (error.response?.data?.error || error.message));
      }
    }
  },

  async create(data: Omit<Subcategory, 'id'>): Promise<Subcategory> {
    try {
      const response = await api.post('/subcategories', data);
      return response.data;
    } catch (error: any) {
      console.error('Error in subcategoryService.create:', error);
      throw new Error('Erro ao criar subcategoria: ' + (error.response?.data?.error || error.message));
    }
  },

  async update(id: number, data: Omit<Subcategory, 'id'>): Promise<Subcategory> {
    try {
      const response = await api.put(`/subcategories/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error in subcategoryService.update:', error);
      throw new Error('Erro ao atualizar subcategoria: ' + (error.response?.data?.error || error.message));
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/subcategories/${id}`);
    } catch (error: any) {
      console.error('Error in subcategoryService.delete:', error);
      throw new Error('Erro ao excluir subcategoria: ' + (error.response?.data?.error || error.message));
    }
  }
};

export default subcategoryService;