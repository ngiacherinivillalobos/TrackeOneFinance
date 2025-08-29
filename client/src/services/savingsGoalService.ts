import api from './api';

export interface SavingsGoal {
  id?: number;
  user_id?: number;
  target_amount: number;
  target_date: string;
  cost_center_id?: number;
  created_at?: string;
  updated_at?: string;
}

export const savingsGoalService = {
  async get(): Promise<SavingsGoal | null> {
    try {
      const response = await api.get('/savings-goals');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async save(data: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
    const response = await api.post('/savings-goals', data);
    return response.data.goal;
  }
};