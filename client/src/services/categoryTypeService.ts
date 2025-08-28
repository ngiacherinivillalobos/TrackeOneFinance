import api from '../services/api';

export interface CategoryType {
  id?: number;
  name: string;
  created_at?: string;
}

export const categoryTypeService = {
  list: async () => {
    const response = await api.get<CategoryType[]>('/category-types');
    return response.data;
  },

  create: async (categoryType: Omit<CategoryType, 'id'>) => {
    const response = await api.post<CategoryType>('/category-types', categoryType);
    return response.data;
  },

  update: async (id: number, categoryType: Omit<CategoryType, 'id'>) => {
    const response = await api.put<CategoryType>(`/category-types/${id}`, categoryType);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/category-types/${id}`);
  }
};
