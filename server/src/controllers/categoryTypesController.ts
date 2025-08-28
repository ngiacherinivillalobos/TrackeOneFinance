import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const categoryTypesController = {
  // Listar todos os tipos de categoria
  async list(req: Request, res: Response) {
    const db = getDatabase();
    
    try {
      const types = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM category_types ORDER BY name', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      res.json(types);
    } catch (error) {
      console.error('Error fetching category types:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar novo tipo de categoria
  async create(req: Request, res: Response) {
    const { name } = req.body;
    const db = getDatabase();

    try {
      const result: any = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO category_types (name) VALUES (?)',
          [name],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      res.status(201).json({ id: result.id, name });
    } catch (error) {
      console.error('Error creating category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Atualizar tipo de categoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE category_types SET name = ? WHERE id = ?',
          [name, id],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      res.json({ id, name });
    } catch (error) {
      console.error('Error updating category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deletar tipo de categoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = getDatabase();

    try {
      // Check if this type is being used by any category
      const usageCount: any = await new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM categories WHERE category_type_id = ?',
          [id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (usageCount.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete this category type because it is being used by one or more categories' 
        });
      }

      await new Promise((resolve, reject) => {
        db.run('DELETE FROM category_types WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
