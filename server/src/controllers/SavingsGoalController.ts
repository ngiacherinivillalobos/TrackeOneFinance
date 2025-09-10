import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const savingsGoalController = {
  // Obter meta de economia de um usuário
  async get(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      
      const { db, get } = getDatabase();
      const goal = await get(db, 'SELECT * FROM savings_goals WHERE user_id = ?', [userId]);
      
      if (!goal) {
        return res.status(404).json({ message: 'Meta de economia não encontrada.' });
      }
      
      res.json(goal);
    } catch (error) {
      console.error('Error fetching savings goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar ou atualizar meta de economia
  async save(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      
      const { target_amount, target_date } = req.body;
      const userCostCenterId = (req as any).user?.cost_center_id;
      
      // Validação
      if (!target_amount || !target_date) {
        return res.status(400).json({ error: 'Valor e data alvo são obrigatórios.' });
      }
      
      if (target_amount <= 0) {
        return res.status(400).json({ error: 'Valor da meta deve ser maior que zero.' });
      }
      
      // Processar a data para evitar problemas de timezone
      // Se a data vem como YYYY-MM-DD, garantir que seja salva corretamente
      let processedDate = target_date;
      if (typeof target_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
        // Para ambos os ambientes, usar a data como está para evitar conversão de timezone
        processedDate = target_date; // Manter como YYYY-MM-DD
      }
      
      // Sempre usar o centro de custo do usuário logado
      const effectiveCostCenterId = userCostCenterId;
      
      const { db, get, run } = getDatabase();
      
      // Verificar se já existe uma meta para este usuário
      const existingGoal = await get(db, 'SELECT * FROM savings_goals WHERE user_id = ?', [userId]);
      
      let result;
      if (existingGoal) {
        // Atualizar meta existente
        const query = effectiveCostCenterId !== undefined
          ? 'UPDATE savings_goals SET target_amount = ?, target_date = ?, cost_center_id = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
          : 'UPDATE savings_goals SET target_amount = ?, target_date = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
        const params = effectiveCostCenterId !== undefined
          ? [target_amount, processedDate, effectiveCostCenterId, userId]
          : [target_amount, processedDate, userId];
            
        await run(db, query, params);
      //
        // Criar nova meta
        const query = effectiveCostCenterId !== undefined
          ? 'INSERT INTO savings_goals (user_id, target_amount, target_date, cost_center_id) VALUES (?, ?, ?, ?)'
          : 'INSERT INTO savings_goals (user_id, target_amount, target_date) VALUES (?, ?, ?)';
        const params = effectiveCostCenterId !== undefined
          ? [userId, target_amount, processedDate, effectiveCostCenterId]
          : [userId, target_amount, processedDate];
            
        result = await run(db, query, params);
      }
      
      res.json({ 
        message: 'Meta de economia salva com sucesso.',
        goal: { 
          id: result?.lastID, 
          user_id: userId, 
          target_amount, 
          target_date: processedDate, 
          cost_center_id: effectiveCostCenterId,
          created_at: existingGoal?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error saving savings goal:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};