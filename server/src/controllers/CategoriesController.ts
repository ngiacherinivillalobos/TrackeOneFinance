import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const categoriesController = {
  // Listar todas as categorias
  async list(req: Request, res: Response) {
    console.log('List categories route hit');
    const db = getDatabase();
    
    try {
      console.log('Executing categories query...');
      const categories = await new Promise((resolve, reject) => {
        const query = `
          SELECT 
            c.id,
            c.name,
            ct.name as source_type,
            c.category_type_id,
            c.created_at
          FROM categories c
          LEFT JOIN category_types ct ON c.category_type_id = ct.id
          ORDER BY c.name
        `;
        console.log('Query:', query);
        db.all(query, [], (err, rows) => {
          if (err) {
            console.error('Database error:', err);
            reject(err);
          } else {
            console.log('Found categories:', rows);
            resolve(rows);
          }
        });
      });
      
      console.log('Sending response:', categories);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar nova categoria
  async create(req: Request, res: Response) {
    const { name, source_type } = req.body;
    const db = getDatabase();

    try {
      // First, get the category_type_id
      const categoryType: any = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM category_types WHERE name = ?', [source_type], (err, row) => {
          if (err) reject(err);
          else if (!row) reject(new Error(`Invalid category type: ${source_type}`));
          else resolve(row);
        });
      });

      const result: any = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO categories (name, category_type_id) VALUES (?, ?)',
          [name, categoryType.id],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      res.status(201).json({ id: result.id, name, source_type });
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof Error && error.message.includes('Invalid category type')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  // Atualizar categoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, source_type } = req.body;
    const db = getDatabase();

    try {
      // First, get the category_type_id
      const categoryType: any = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM category_types WHERE name = ?', [source_type], (err, row) => {
          if (err) reject(err);
          else if (!row) reject(new Error(`Invalid category type: ${source_type}`));
          else resolve(row);
        });
      });

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE categories SET name = ?, category_type_id = ? WHERE id = ?',
          [name, categoryType.id, id],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      res.json({ id, name, source_type });
    } catch (error) {
      console.error('Error updating category:', error);
      if (error instanceof Error && error.message.includes('Invalid category type')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  // Buscar uma categoria por id
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const db = getDatabase();

    try {
      const category: any = await new Promise((resolve, reject) => {
        const query = `
          SELECT
            c.id,
            c.name,
            ct.name as source_type,
            c.category_type_id,
            c.created_at
          FROM categories c
          LEFT JOIN category_types ct ON c.category_type_id = ct.id
          WHERE c.id = ?
        `;
        db.get(query, [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!category) return res.status(404).json({ error: 'Category not found' });

      res.json(category);
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Deletar categoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default categoriesController;
