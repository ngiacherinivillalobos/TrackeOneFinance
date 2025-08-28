import api from '../services/api';

// Add response interceptor for debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
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
    const response = await api.get<Category[]>('/categories');
    return response.data;
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
