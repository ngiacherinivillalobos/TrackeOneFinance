import api from '../services/api';

export interface Subcategory {
  id?: number;
  name: string;
  category_id: number;
  category_name?: string;
  created_at?: string;
}

export const subcategoryService = {
  async list(): Promise<Subcategory[]> {
    const response = await api.get('/subcategories');
    return response.data;
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
