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
      const response = await api.get<Category[]>('/categories');
      console.log('Categories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in categoryService.list:', error);
      throw error;
    }
  },

  create: async (category: Omit<Category, 'id'>) => {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },

  update: async (id: number, category: Omit<Category, 'id'>) => {
    const response = await api.put<Category>(`/categories/${id}`, category);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/categories/${id}`);
  }
};