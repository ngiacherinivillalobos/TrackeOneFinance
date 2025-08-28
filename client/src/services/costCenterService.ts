import api from '../services/api';

export interface CostCenter {
  id?: number;
  name: string;
  number?: string;
  created_at?: string;
}

export const costCenterService = {
  async list(): Promise<CostCenter[]> {
    const response = await api.get('/cost-centers');
    return response.data;
  },

  async create(data: Omit<CostCenter, 'id'>): Promise<CostCenter> {
    const response = await api.post('/cost-centers', data);
    return response.data;
  },

  async update(id: number, data: Omit<CostCenter, 'id'>): Promise<CostCenter> {
    const response = await api.put(`/cost-centers/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/cost-centers/${id}`);
  }
};
