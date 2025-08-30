import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const userController = {
  // Listar todos os usuários
  async list(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const users = await all(db, 'SELECT id, email, cost_center_id, created_at FROM users');
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar um novo usuário
  async create(req: Request, res: Response) {
    const { email, password, cost_center_id } = req.body;
    
    // Validação
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }
    
    // Validar tamanho da senha
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
    }
    
    try {
      const { db, get, run } = getDatabase();
      
      // Verificar se usuário já existe
      const existingUser = await get(db, 'SELECT * FROM users WHERE email = ?', [email]);
      
      if (existingUser) {
        return res.status(409).json({ error: 'Usuário já existe.' });
      }
      
      // Criptografar senha
      const hash = await bcrypt.hash(password, 10);
      
      // Inserir novo usuário
      const query = cost_center_id 
        ? 'INSERT INTO users (email, password, cost_center_id) VALUES (?, ?, ?)'
        : 'INSERT INTO users (email, password) VALUES (?, ?)';
      const params = cost_center_id 
        ? [email, hash, cost_center_id]
        : [email, hash];
          
      const result: any = await run(db, query, params);
      
      res.status(201).json({ 
        message: 'Usuário criado com sucesso.',
        user: { id: result.lastID, email, cost_center_id, created_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Excluir um usuário
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    
    // Não permitir que um usuário se exclua
    const userId = (req as any).user?.id;
    if (parseInt(id) === userId) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário.' });
    }
    
    try {
      const { db, get, run } = getDatabase();
      
      // Verificar se usuário existe
      const existingUser = await get(db, 'SELECT * FROM users WHERE id = ?', [id]);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      // Excluir usuário
      await run(db, 'DELETE FROM users WHERE id = ?', [id]);
      
      res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Redefinir senha de um usuário
  async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { password, cost_center_id } = req.body;
    
    // Validar senha
    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
    }
    
    try {
      const { db, get, run } = getDatabase();
      
      // Verificar se usuário existe
      const existingUser = await get(db, 'SELECT * FROM users WHERE id = ?', [id]);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      // Criptografar nova senha
      const hash = await bcrypt.hash(password, 10);
      
      // Atualizar senha e centro de custo (se fornecido)
      const query = cost_center_id !== undefined
        ? 'UPDATE users SET password = ?, cost_center_id = ? WHERE id = ?'
        : 'UPDATE users SET password = ? WHERE id = ?';
      const params = cost_center_id !== undefined
        ? [hash, cost_center_id, id]
        : [hash, id];
          
      await run(db, query, params);
      
      res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Associar centro de custo a um usuário
  async updateCostCenter(req: Request, res: Response) {
    const { id } = req.params;
    const { cost_center_id } = req.body;
    
    console.log(`Atualizando centro de custo para usuário ${id}:`, { cost_center_id });
    
    try {
      const { db, get, run } = getDatabase();
      
      // Verificar se usuário existe
      const existingUser = await get(db, 'SELECT * FROM users WHERE id = ?', [id]);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      // Atualizar centro de custo
      await run(db, 'UPDATE users SET cost_center_id = ? WHERE id = ?', [cost_center_id, id]);
      
      res.json({ message: 'Centro de custo atualizado com sucesso.' });
    } catch (error) {
      console.error('Error updating cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};