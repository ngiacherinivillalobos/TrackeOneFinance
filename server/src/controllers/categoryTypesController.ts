import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const categoryTypesController = {
  // Listar todos os tipos de categoria
  async list(req: Request, res: Response) {
    const { db, all } = getDatabase();
    
    try {
      const types = await all(db, 'SELECT * FROM category_types ORDER BY name');
      res.json(types);
    } catch (error) {
      console.error('Error fetching category types:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar novo tipo de categoria
  async create(req: Request, res: Response) {
    const { name } = req.body;
    const { db, run } = getDatabase();

    try {
      const result: any = await run(db, 'INSERT INTO category_types (name) VALUES (?)', [name]);
      res.status(201).json({ id: result.lastID, name });
    } catch (error) {
      console.error('Error creating category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Atualizar tipo de categoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;
    const { db, run } = getDatabase();

    try {
      await run(db, 'UPDATE category_types SET name = ? WHERE id = ?', [name, id]);
      res.json({ id, name });
    } catch (error) {
      console.error('Error updating category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deletar tipo de categoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { db, get, run } = getDatabase();

    try {
      // Check if this type is being used by any category
      const usageCount: any = await get(db, 'SELECT COUNT(*) as count FROM categories WHERE category_type_id = ?', [id]);

      if (usageCount.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete this category type because it is being used by one or more categories' 
        });
      }

      await run(db, 'DELETE FROM category_types WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};