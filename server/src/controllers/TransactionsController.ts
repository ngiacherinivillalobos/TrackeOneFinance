import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

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
  recurrence_type?: 'unica' | 'mensal' | 'fixo' | 'personalizado';
  recurrence_count?: number;
  recurrence_end_date?: string;
  created_at?: string;
  // For joins
  category_name?: string;
  subcategory_name?: string;
  payment_status_name?: string;
  contact_name?: string;
  cost_center_name?: string;
  cost_center_number?: string;
}

const transactionController = {
  // Função auxiliar para determinar o status de pagamento baseado na regra de negócio
  getPaymentStatusId(transaction_date: string, requested_payment_status_id?: number): number {
    const today = new Date().toISOString().split('T')[0];
    const transactionDate = new Date(transaction_date).toISOString().split('T')[0];
    
    // Se a transação é de hoje ou futuro, sempre usar "Em aberto" (id 1)
    if (transactionDate >= today) {
      return 1; // Em aberto
    }
    
    // Se é do passado e não foi especificado um status, usar "Pago" (id 2)
    if (!requested_payment_status_id) {
      return 2; // Pago
    }
    
    // Caso contrário, usar o status solicitado
    return requested_payment_status_id;
  },

  async list(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      
      const query = `
        SELECT 
          t.*,
          c.name as category_name,
          s.name as subcategory_name,
          ps.name as payment_status_name,
          cont.name as contact_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
      `;

      const transactions = await new Promise<any[]>((resolve, reject) => {
        db.all(query, [], (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      const { id } = req.params;

      const query = `
        SELECT 
          t.*,
          c.name as category_name,
          s.name as subcategory_name,
          ps.name as payment_status_name,
          cont.name as contact_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        WHERE t.id = ?
      `;

      const transaction = await new Promise<any>((resolve, reject) => {
        db.get(query, [id], (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      const {
        description,
        amount,
        transaction_type,
        category_id,
        subcategory_id,
        payment_status_id,
        contact_id,
        cost_center_id,
        transaction_date,
        is_recurring,
        recurrence_type,
        recurrence_count,
        recurrence_end_date
      } = req.body;

      // Validate required fields
      if (!description || amount === undefined || !transaction_type || !transaction_date) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate transaction_type
      if (!['Despesa', 'Receita', 'Investimento'].includes(transaction_type)) {
        res.status(400).json({ error: 'Invalid transaction type' });
        return;
      }

      // Aplicar regra de negócio para determinar o status de pagamento correto
      const finalPaymentStatusId = this.getPaymentStatusId(transaction_date, payment_status_id);

      const query = `
        INSERT INTO transactions (
          description, amount, type, category_id, subcategory_id, 
          payment_status_id, contact_id, transaction_date,
          is_recurring, recurrence_type, recurrence_count, recurrence_end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        description,
        amount,
        transaction_type,
        category_id || null,
        subcategory_id || null,
        finalPaymentStatusId,
        contact_id || null,
        transaction_date,
        is_recurring || false,
        recurrence_type || 'unica',
        recurrence_count || null,
        recurrence_end_date || null
      ];

      const result = await new Promise<any>((resolve, reject) => {
        db.run(query, values, function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        });
      });

      // Fetch the created transaction with all related data
      const selectQuery = `
        SELECT 
          t.*,
          c.name as category_name,
          s.name as subcategory_name,
          ps.name as payment_status_name,
          cont.name as contact_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        WHERE t.id = ?
      `;

      const createdTransaction = await new Promise<any>((resolve, reject) => {
        db.get(selectQuery, [result.id], (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      res.status(201).json(createdTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      const { id } = req.params;
      const {
        description,
        amount,
        transaction_type,
        category_id,
        subcategory_id,
        payment_status_id,
        contact_id,
        cost_center_id,
        transaction_date,
        is_recurring,
        recurrence_type,
        recurrence_count,
        recurrence_end_date
      } = req.body;

      // Validate required fields
      if (!description || amount === undefined || !transaction_type || !transaction_date) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate transaction_type
      if (!['Despesa', 'Receita', 'Investimento'].includes(transaction_type)) {
        res.status(400).json({ error: 'Invalid transaction type' });
        return;
      }

      // Aplicar regra de negócio para determinar o status de pagamento correto
      const finalPaymentStatusId = this.getPaymentStatusId(transaction_date, payment_status_id);

      const query = `
        UPDATE transactions SET
          description = ?, amount = ?, type = ?, category_id = ?,
          subcategory_id = ?, payment_status_id = ?, contact_id = ?,
          transaction_date = ?
        WHERE id = ?
      `;

      const values = [
        description,
        amount,
        transaction_type,
        category_id || null,
        subcategory_id || null,
        finalPaymentStatusId,
        contact_id || null,
        transaction_date,
        id
      ];

      await new Promise<void>((resolve, reject) => {
        db.run(query, values, function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Fetch the updated transaction with all related data
      const selectQuery = `
        SELECT 
          t.*,
          c.name as category_name,
          s.name as subcategory_name,
          ps.name as payment_status_name,
          cont.name as contact_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        WHERE t.id = ?
      `;

      const updatedTransaction = await new Promise<any>((resolve, reject) => {
        db.get(selectQuery, [id], (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      if (!updatedTransaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      const { id } = req.params;

      const query = 'DELETE FROM transactions WHERE id = ?';

      await new Promise<void>((resolve, reject) => {
        db.run(query, [id], function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default transactionController;
