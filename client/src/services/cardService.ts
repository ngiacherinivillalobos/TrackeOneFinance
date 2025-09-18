import api from '../lib/axios';

export interface Card {
  id?: number;
  name: string;
  card_number?: string;
  expiry_date?: string;
  brand?: string;
  closing_day?: number; // Dia de fechamento da fatura
  due_day?: number; // Dia de vencimento da fatura
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