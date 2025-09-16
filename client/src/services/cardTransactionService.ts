import api from '../lib/axios';

export interface CardTransaction {
  id?: number;
  description: string;
  amount: number;
  type: string;
  category_id?: number;
  subcategory_id?: number;
  card_id: number;
  cost_center_id?: number;
  transaction_date: string;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  created_at?: string;
}

export interface CreateInstallmentsRequest {
  description: string;
  total_amount: number;
  total_installments: number;
  card_id: number;
  category_id?: number;
  subcategory_id?: number;
  cost_center_id?: number;
  transaction_date: string;
}

export interface CreateInstallmentsResponse {
  message: string;
  transactions: CardTransaction[];
  total_amount: number;
  installment_amount: number;
  last_installment_amount: number;
}

export const cardTransactionService = {
  // Criar transações parceladas
  async createInstallments(data: CreateInstallmentsRequest): Promise<CreateInstallmentsResponse> {
    const response = await api.post('/transactions/installments', data);
    return response.data;
  },

  // Listar transações de um cartão específico
  async getByCard(cardId: number): Promise<CardTransaction[]> {
    const response = await api.get(`/transactions?card_id=${cardId}`);
    return response.data;
  },

  // Buscar transações filtradas
  async getFiltered(filters: any): Promise<CardTransaction[]> {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/transactions/filtered?${params.toString()}`);
    return response.data;
  },

  // Atualizar transação individual
  async update(id: number, data: Partial<CardTransaction>): Promise<CardTransaction> {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  // Excluir transação
  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  // Obter detalhes de uma transação
  async getById(id: number): Promise<CardTransaction> {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Marcar transação como paga
  async markAsPaid(id: number, paymentData: {
    payment_date: string;
    paid_amount: number;
    payment_type: string;
    observations?: string;
  }): Promise<any> {
    const response = await api.post(`/transactions/${id}/mark-as-paid`, paymentData);
    return response.data;
  }
};