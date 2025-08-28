import api from '../services/api';

export interface PaymentData {
  payment_date: string;
  paid_amount: number;
  payment_type: 'bank_account' | 'credit_card';
  bank_account_id?: number;
  card_id?: number;
  observations?: string;
  discount?: number;
  interest?: number;
}

export interface PaymentDetails {
  id: number;
  transaction_id: number;
  payment_date: string;
  paid_amount: number;
  original_amount: number;
  payment_type: string;
  bank_account_id?: number;
  card_id?: number;
  discount_amount: number;
  interest_amount: number;
  observations?: string;
  bank_account_name?: string;
  card_name?: string;
  created_at: string;
}

export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
  category_id?: number;
  subcategory_id?: number;
  payment_status_id?: number;
  contact_id?: number;
  cost_center_id?: number;
  transaction_date: string;
  is_recurring: boolean;
  recurrence_type?: 'unica' | 'mensal' | 'semanal' | 'personalizado' | 'fixo';
  recurrence_count?: number;
  recurrence_weekday?: string;
  recurrence_end_date?: string;
  recurrence_days?: number; // Para recorrência personalizada
  created_at?: string;
  updated_at?: string;
  
  // Campos para exibição (vindos do JOIN)
  category_name?: string;
  category_type?: string;
  subcategory_name?: string;
  payment_status_name?: string;
  contact_name?: string;
  cost_center_name?: string;
  cost_center_number?: string;
}

export const transactionService = {
  async list(params?: URLSearchParams): Promise<Transaction[]> {
    let url = '/transactions';
    if (params && params.toString()) {
      url += `?${params.toString()}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  async getById(id: number): Promise<Transaction> {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },

  async update(id: number, transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async markAsPaid(id: number, paymentData: PaymentData): Promise<any> {
    const response = await api.post(`/transactions/${id}/mark-as-paid`, paymentData);
    return response.data;
  },

  async getPaymentDetails(id: number): Promise<PaymentDetails[]> {
    const response = await api.get(`/transactions/${id}/payment-details`);
    return response.data;
  }
};
