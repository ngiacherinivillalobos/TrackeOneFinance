import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

// Função helper para obter data local no formato YYYY-MM-DD
const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função helper para criar Date segura para timezone
const createSafeDate = (dateString: string): Date => {
  // Se a string já tem T12:00:00, usar diretamente
  if (dateString.includes('T12:00:00')) {
    return new Date(dateString);
  }
  // Se é só a data (YYYY-MM-DD), adicionar T12:00:00 para evitar timezone offset
  return new Date(dateString + 'T12:00:00');
};

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
    const today = getLocalDateString();
    const transactionDate = createSafeDate(transaction_date).toISOString().split('T')[0];
    
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
          cont.name as contact_name,
          CASE
            WHEN t.payment_status_id = 2 THEN 1
            ELSE 0
          END as is_paid
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        ORDER BY t.transaction_date ASC, t.created_at DESC
      `;

      const dbWrapper = getDatabase();
      const transactions = await dbWrapper.all(dbWrapper.db, query, []);
      
      // Formatar as datas consistentemente entre ambientes
      const formattedTransactions = transactions.map((transaction: any) => {
        // Se transaction_date for um objeto Date (PostgreSQL), converter para string no formato YYYY-MM-DD
        if (transaction.transaction_date instanceof Date) {
          // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
          transaction.transaction_date = transaction.transaction_date.toISOString().split('T')[0];
        }
        
        // Garantir que o campo amount seja sempre um número
        if (typeof transaction.amount === 'string') {
          transaction.amount = parseFloat(transaction.amount);
        }
        
        // Converter is_paid de inteiro para booleano (se existir)
        if (transaction.is_paid !== undefined) {
          transaction.is_paid = transaction.is_paid === 1;
        }
        
        // Se já estiver no formato string (SQLite), manter como está
        return transaction;
      });

      res.json(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const dbWrapper = getDatabase();
      const { id } = req.params;

      const query = `
        SELECT 
          t.*,
          c.name as category_name,
          s.name as subcategory_name,
          ps.name as payment_status_name,
          cont.name as contact_name,
          CASE
            WHEN t.payment_status_id = 2 THEN 1
            ELSE 0
          END as is_paid
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN subcategories s ON t.subcategory_id = s.id
        LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
        LEFT JOIN contacts cont ON t.contact_id = cont.id
        WHERE t.id = $1
      `;

      const transaction = await dbWrapper.get(dbWrapper.db, query, [id]);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      
      // Formatar a data consistentemente entre ambientes
      if (transaction.transaction_date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        transaction.transaction_date = transaction.transaction_date.toISOString().split('T')[0];
      }
      
      // Garantir que o campo amount seja sempre um número
      if (typeof transaction.amount === 'string') {
        transaction.amount = parseFloat(transaction.amount);
      }
      
      // Converter is_paid de inteiro para booleano (se existir)
      if (transaction.is_paid !== undefined) {
        transaction.is_paid = transaction.is_paid === 1;
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dbWrapper = getDatabase();
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
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

      const result = await dbWrapper.run(dbWrapper.db, query, values);

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
        WHERE t.id = $1
      `;

      const createdTransaction = await dbWrapper.get(dbWrapper.db, selectQuery, [result.lastID]);
      
      // Formatar a data consistentemente entre ambientes
      if (createdTransaction && createdTransaction.transaction_date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        createdTransaction.transaction_date = createdTransaction.transaction_date.toISOString().split('T')[0];
      }

      res.status(201).json(createdTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const dbWrapper = getDatabase();
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
          description = $1, amount = $2, type = $3, category_id = $4,
          subcategory_id = $5, payment_status_id = $6, contact_id = $7,
          transaction_date = $8
        WHERE id = $9
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

      await dbWrapper.run(dbWrapper.db, query, values);

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
        WHERE t.id = $1
      `;

      const updatedTransaction = await dbWrapper.get(dbWrapper.db, selectQuery, [id]);

      if (!updatedTransaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      
      // Formatar a data consistentemente entre ambientes
      if (updatedTransaction.transaction_date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        updatedTransaction.transaction_date = updatedTransaction.transaction_date.toISOString().split('T')[0];
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const dbWrapper = getDatabase();
      const { id } = req.params;

      const query = 'DELETE FROM transactions WHERE id = $1';

      await dbWrapper.run(dbWrapper.db, query, [id]);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default transactionController;
