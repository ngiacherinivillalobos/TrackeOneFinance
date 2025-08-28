import api from '../services/api';

export interface PaymentStatus {
  id?: number;
  name: string;
  created_at?: string;
}

export const paymentStatusService = {
  async list(): Promise<PaymentStatus[]> {
    const response = await api.get('/payment-statuses');
    return response.data;
  },

  async create(data: Omit<PaymentStatus, 'id'>): Promise<PaymentStatus> {
    const response = await api.post('/payment-statuses', data);
    return response.data;
  },

  async update(id: number, data: Omit<PaymentStatus, 'id'>): Promise<PaymentStatus> {
    const response = await api.put(`/payment-statuses/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/payment-statuses/${id}`);
  }
};

export default paymentStatusService;
