import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const subcategoriesController = {
  // Listar todas as subcategorias ou de uma categoria específica
  async list(req: Request, res: Response) {
    const { categoryId } = req.query;
    const { db, all } = getDatabase();

    try {
      let query = 'SELECT * FROM subcategories';
      let params: any[] = [];

      if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
      }
      
      query += ' ORDER BY name';

      const subcategories = await all(db, query, params);
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar nova subcategoria
  async create(req: Request, res: Response) {
    const { name, category_id } = req.body;
    const { db, run } = getDatabase();

    try {
      const result: any = await run(db, 'INSERT INTO subcategories (name, category_id) VALUES (?, ?)', [name, category_id || null]);
      res.status(201).json({ id: result.lastID, name, category_id: category_id || null });
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Atualizar subcategoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, category_id } = req.body;
    const { db, run } = getDatabase();

    try {
      await run(db, 'UPDATE subcategories SET name = ?, category_id = ? WHERE id = ?', [name, category_id || null, id]);
      res.json({ id, name, category_id: category_id || null });
    } catch (error) {
      console.error('Error updating subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deletar subcategoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { db, run } = getDatabase();

    try {
      await run(db, 'DELETE FROM subcategories WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default subcategoriesController;