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
  is_paid?: boolean;
  payment_date?: string;
  paid_amount?: number;
  payment_type?: string;
  payment_observations?: string;
  discount?: number;
  interest?: number;
  category_name?: string;
  subcategory_name?: string;
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
    const response = await api.post('/credit-card-transactions/installments', data);
    return response.data;
  },

  // Listar transações de um cartão específico
  async getByCard(cardId: number): Promise<CardTransaction[]> {
    const response = await api.get(`/credit-card-transactions?card_id=${cardId}`);
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

    const response = await api.get(`/credit-card-transactions?${params.toString()}`);
    console.log('Resposta da API de transações:', response.data);
    return response.data;
  },

  // Atualizar transação individual
  async update(id: number, data: Partial<CardTransaction>): Promise<CardTransaction> {
    // Remover campos undefined para não sobrescrever os valores existentes
    const cleanData: Partial<CardTransaction> = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key as keyof CardTransaction];
        if (value !== undefined) {
          (cleanData as any)[key] = value;
        }
      }
    }

    const response = await api.put(`/credit-card-transactions/${id}`, cleanData);
    return response.data;
  },

  // Excluir transação
  async delete(id: number): Promise<void> {
    await api.delete(`/credit-card-transactions/${id}`);
  },

  // Obter detalhes de uma transação
  async getById(id: number): Promise<CardTransaction> {
    const response = await api.get(`/credit-card-transactions/${id}`);
    return response.data;
  },

  // Criar transação individual
  async create(data: Omit<CardTransaction, 'id'>): Promise<CardTransaction> {
    const response = await api.post('/credit-card-transactions', data);
    return response.data;
  }
};