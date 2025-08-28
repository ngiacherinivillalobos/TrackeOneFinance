import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const subcategoriesController = {
  // Listar todas as subcategorias ou de uma categoria específica
  async list(req: Request, res: Response) {
    const { categoryId } = req.query;
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM subcategories';
      let params: any[] = [];

      if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
      }
      
      query += ' ORDER BY name';

      const subcategories = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar nova subcategoria
  async create(req: Request, res: Response) {
    const { name, category_id } = req.body;
    const db = getDatabase();

    try {
      const result: any = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO subcategories (name, category_id) VALUES (?, ?)',
          [name, category_id || null],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      res.status(201).json({ id: result.id, name, category_id: category_id || null });
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Atualizar subcategoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, category_id } = req.body;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE subcategories SET name = ?, category_id = ? WHERE id = ?',
          [name, category_id || null, id],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      res.json({ id, name, category_id: category_id || null });
    } catch (error) {
      console.error('Error updating subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deletar subcategoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM subcategories WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default subcategoriesController;
