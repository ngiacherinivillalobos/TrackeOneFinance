import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

// Interface para o Cash Flow
interface CashFlow {
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

export const CashFlowController = {
  // Listar todos os registros de cash flow
  getAll: async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const { month, year } = req.query;
      const userCostCenterId = (req as any).user?.cost_center_id;

      let query = `
        SELECT 
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
      `;

      const params: any[] = [];
      const whereConditions: string[] = [];

      // Filtro por mês/ano se fornecido
      if (month && year) {
        whereConditions.push("strftime('%m', cf.date) = ? AND strftime('%Y', cf.date) = ?");
        params.push(month.toString().padStart(2, '0'), year.toString());
      }

      // Filtro por centro de custo do usuário
      if (req.query.cost_center_id) {
        // Se o valor for 'all', não aplicar filtro de centro de custo
        if (req.query.cost_center_id === 'all') {
          console.log('Showing all cost centers');
        } else {
          whereConditions.push("cf.cost_center_id = ?");
          params.push(req.query.cost_center_id);
        }
      } else if (userCostCenterId && req.query.show_all_centers !== 'true') {
        whereConditions.push("cf.cost_center_id = ?");
        params.push(userCostCenterId);
      }

      // Adicionar cláusula WHERE se houver condições
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` ORDER BY cf.date DESC, cf.created_at DESC`;

      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error fetching cash flow records:', err);
          return res.status(500).json({ error: 'Failed to fetch cash flow records' });
        }
        res.json(rows);
      });
    } catch (error) {
      console.error('Error in getAll cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Obter um registro específico
  getById: async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const { id } = req.params;

      const query = `
        SELECT
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
        WHERE cf.id = ?
      `;

      db.get(query, [id], (err, row) => {
        if (err) {
          console.error('Error fetching cash flow record:', err);
          return res.status(500).json({ error: 'Failed to fetch cash flow record' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Cash flow record not found' });
        }
        res.json(row);
      });
    } catch (error) {
      console.error('Error in getById cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar novo registro
  create: async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const { date, description, amount, record_type, category_id, subcategory_id, cost_center_id }: CashFlow = req.body;
      const userCostCenterId = (req as any).user?.cost_center_id;

      // Validações básicas
      if (!date || !description || !amount || !record_type) {
        return res.status(400).json({ error: 'Required fields: date, description, amount, record_type' });
      }

      if (!['Despesa', 'Receita'].includes(record_type)) {
        return res.status(400).json({ error: 'record_type must be "Despesa" or "Receita"' });
      }

      // Garantir que sempre haja um centro de custo (do usuário se não for especificado)
      let effectiveCostCenterId = userCostCenterId;
      if (cost_center_id !== undefined && cost_center_id !== null && String(cost_center_id) !== '') {
        effectiveCostCenterId = Number(cost_center_id);
      }

      // Validar se o centro de custo é obrigatório
      if (!effectiveCostCenterId) {
        return res.status(400).json({ error: 'Centro de custo é obrigatório' });
      }

      const query = `
        INSERT INTO cash_flow (date, description, amount, record_type, category_id, subcategory_id, cost_center_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        date,
        description,
        amount,
        record_type,
        category_id || null,
        subcategory_id || null,
        effectiveCostCenterId
      ];

      db.run(query, params, function(err) {
        if (err) {
          console.error('Error creating cash flow record:', err);
          return res.status(500).json({ error: 'Failed to create cash flow record' });
        }
        
        // Retornar o registro criado
        const selectQuery = `
          SELECT
            cf.id,
            cf.date,
            cf.description,
            cf.amount,
            cf.record_type,
            cf.category_id,
            cf.subcategory_id,
            cf.cost_center_id,
            c.name as category_name,
            sc.name as subcategory_name,
            cc.name as cost_center_name,
            cc.number as cost_center_number,
            cf.created_at,
            cf.updated_at
          FROM cash_flow cf
          LEFT JOIN categories c ON cf.category_id = c.id
          LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
          LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
          WHERE cf.id = ?
        `;

        db.get(selectQuery, [this.lastID], (err, row) => {
          if (err) {
            console.error('Error fetching created record:', err);
            return res.status(500).json({ error: 'Record created but failed to fetch' });
          }
          res.status(201).json(row);
        });
      });
    } catch (error) {
      console.error('Error in create cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Atualizar registro
  update: async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const { id } = req.params;
      const { date, description, amount, record_type, category_id, subcategory_id, cost_center_id }: CashFlow = req.body;
      const userCostCenterId = (req as any).user?.cost_center_id;

      // Verificar se o registro existe
      db.get('SELECT id FROM cash_flow WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error checking cash flow record:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Cash flow record not found' });
        }

        // Validações
        if (record_type && !['Despesa', 'Receita'].includes(record_type)) {
          return res.status(400).json({ error: 'record_type must be "Despesa" or "Receita"' });
        }

        // Garantir que sempre haja um centro de custo (do usuário se não for especificado)
        let effectiveCostCenterId = userCostCenterId;
        if (cost_center_id !== undefined && cost_center_id !== null && String(cost_center_id) !== '') {
          effectiveCostCenterId = Number(cost_center_id);
        }

        const query = `
          UPDATE cash_flow
          SET date = ?, description = ?, amount = ?, record_type = ?,
              category_id = ?, subcategory_id = ?, cost_center_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        const params = [
          date,
          description,
          amount,
          record_type,
          category_id || null,
          subcategory_id || null,
          effectiveCostCenterId || null,
          id
        ];

        db.run(query, params, function(err) {
          if (err) {
            console.error('Error updating cash flow record:', err);
            return res.status(500).json({ error: 'Failed to update cash flow record' });
          }

          // Retornar o registro atualizado
          const selectQuery = `
            SELECT
              cf.id,
              cf.date,
              cf.description,
              cf.amount,
              cf.record_type,
              cf.category_id,
              cf.subcategory_id,
              cf.cost_center_id,
              c.name as category_name,
              sc.name as subcategory_name,
              cc.name as cost_center_name,
              cc.number as cost_center_number,
              cf.created_at,
              cf.updated_at
            FROM cash_flow cf
            LEFT JOIN categories c ON cf.category_id = c.id
            LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
            LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
            WHERE cf.id = ?
          `;

          db.get(selectQuery, [id], (err, row) => {
            if (err) {
              console.error('Error fetching updated record:', err);
              return res.status(500).json({ error: 'Record updated but failed to fetch' });
            }
            res.json(row);
          });
        });
      });
    } catch (error) {
      console.error('Error in update cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Excluir registro
  delete: async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const { id } = req.params;

      // Verificar se o registro existe
      db.get('SELECT id FROM cash_flow WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error checking cash flow record:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Cash flow record not found' });
        }

        // Excluir o registro
        db.run('DELETE FROM cash_flow WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Error deleting cash flow record:', err);
            return res.status(500).json({ error: 'Failed to delete cash flow record' });
          }
          res.json({ message: 'Cash flow record deleted successfully', id: parseInt(id) });
        });
      });
    } catch (error) {
      console.error('Error in delete cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};