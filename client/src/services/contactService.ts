import api from '../services/api';

export interface Contact {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

export const contactService = {
  async list(): Promise<Contact[]> {
    const response = await api.get('/contacts');
    return response.data;
  },

  async create(data: Omit<Contact, 'id'>): Promise<Contact> {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  async update(id: number, data: Omit<Contact, 'id'>): Promise<Contact> {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/contacts/${id}`);
  }
};
