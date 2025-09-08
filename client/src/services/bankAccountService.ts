import api from '../lib/axios';

export interface BankAccount {
  id?: number;
  name: string;
  agency?: string;
  account_number?: string;
  bank_name?: string;
  balance?: number;
  created_at?: string;
}

export const bankAccountService = {
  async list(): Promise<BankAccount[]> {
    const response = await api.get('/bank-accounts');
    // Mapear type para bank_name para compatibilidade com o frontend
    return response.data.map((item: any) => ({
      ...item,
      bank_name: item.type || item.bank_name
    }));
  },

  async create(data: Omit<BankAccount, 'id'>): Promise<BankAccount> {
    const response = await api.post('/bank-accounts', data);
    return response.data;
  },

  async update(id: number, data: Omit<BankAccount, 'id'>): Promise<BankAccount> {
    const response = await api.put(`/bank-accounts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/bank-accounts/${id}`);
  }
};
