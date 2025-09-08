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
      const response = await api.get('/subcategories');
      console.log('Subcategories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in subcategoryService.list:', error);
      throw error;
    }
  },

  async create(data: Omit<Subcategory, 'id'>): Promise<Subcategory> {
    const response = await api.post('/subcategories', data);
    return response.data;
  },

  async update(id: number, data: Omit<Subcategory, 'id'>): Promise<Subcategory> {
    const response = await api.put(`/subcategories/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/subcategories/${id}`);
  }
};

export default subcategoryService;