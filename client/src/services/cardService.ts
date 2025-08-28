import api from '../services/api';

export interface Card {
  id?: number;
  name: string;
  card_number?: string;
  expiry_date?: string;
  brand?: string;
  created_at?: string;
}

export const cardService = {
  async list(): Promise<Card[]> {
    const response = await api.get('/cards');
    return response.data;
  },

  async create(data: Omit<Card, 'id'>): Promise<Card> {
    const response = await api.post('/cards', data);
    return response.data;
  },

  async update(id: number, data: Omit<Card, 'id'>): Promise<Card> {
    const response = await api.put(`/cards/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/cards/${id}`);
  }
};
