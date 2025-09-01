import api from './api';

export interface CashFlow {
  id?: number;
  date: string;
  description: string;
  amount: number;
  record_type: 'Despesa' | 'Receita';
  category_id?: number;
  subcategory_id?: number;
  cost_center_id?: number;
  category_name?: string;
  subcategory_name?: string;
  cost_center_name?: string;
  cost_center_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowFilters {
  month?: number;
  year?: number;
  cost_center_id?: number | string; // Adicionar suporte para filtro de centro de custo
}

class CashFlowService {
  private baseURL = '/cash-flow';

  // Listar todos os registros
  async getAll(filters?: CashFlowFilters): Promise<CashFlow[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.month) {
        params.append('month', filters.month.toString());
      }
      
      if (filters?.year) {
        params.append('year', filters.year.toString());
      }
      
      // Adicionar filtro de centro de custo se especificado
      if (filters?.cost_center_id !== undefined) {
        params.append('cost_center_id', filters.cost_center_id.toString());
      }

      console.log('CashFlow getAll - Params:', params.toString());
      
      const response = await api.get(`${this.baseURL}?${params.toString()}`);
      console.log('CashFlow getAll - Response data:', response.data.length, 'registros');
      return response.data;
    } catch (error) {
      console.error('Error fetching cash flow records:', error);
      throw error;
    }
  }

  // Obter registro por ID
  async getById(id: number): Promise<CashFlow> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cash flow record:', error);
      throw error;
    }
  }

  // Criar novo registro
  async create(cashFlow: Omit<CashFlow, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'subcategory_name'>): Promise<CashFlow> {
    try {
      const response = await api.post(this.baseURL, cashFlow);
      return response.data;
    } catch (error) {
      console.error('Error creating cash flow record:', error);
      throw error;
    }
  }

  // Atualizar registro
  async update(id: number, cashFlow: Omit<CashFlow, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'subcategory_name'>): Promise<CashFlow> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, cashFlow);
      return response.data;
    } catch (error) {
      console.error('Error updating cash flow record:', error);
      throw error;
    }
  }

  // Excluir registro
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
    } catch (error) {
      console.error('Error deleting cash flow record:', error);
      throw error;
    }
  }
}

export default new CashFlowService();