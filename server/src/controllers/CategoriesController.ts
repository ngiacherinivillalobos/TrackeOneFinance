import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const categoriesController = {
  // Listar todas as categorias
  async list(req: Request, res: Response) {
    console.log('List categories route hit');
    const { db, all } = getDatabase();
    
    try {
      console.log('Executing categories query...');
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
      const categories = await all(db, query);
      console.log('Found categories:', categories);
      
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
    const { db, get, run } = getDatabase();

    try {
      // First, get the category_type_id
      const categoryType: any = await get(db, 'SELECT id FROM category_types WHERE name = ?', [source_type]);
      if (!categoryType) {
        throw new Error(`Invalid category type: ${source_type}`);
      }

      const result: any = await run(db, 'INSERT INTO categories (name, category_type_id) VALUES (?, ?)', [name, categoryType.id]);

      res.status(201).json({ id: result.lastID, name, source_type });
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
    const { db, get, run } = getDatabase();

    try {
      // First, get the category_type_id
      const categoryType: any = await get(db, 'SELECT id FROM category_types WHERE name = ?', [source_type]);
      if (!categoryType) {
        throw new Error(`Invalid category type: ${source_type}`);
      }

      await run(db, 'UPDATE categories SET name = ?, category_type_id = ? WHERE id = ?', [name, categoryType.id, id]);

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
    const { db, get } = getDatabase();

    try {
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
      const category: any = await get(db, query, [id]);

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
    const { db, run } = getDatabase();

    try {
      await run(db, 'DELETE FROM categories WHERE id = ?', [id]);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default categoriesController;