import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const categoriesController = {
  // Listar todas as categorias
  async list(req: Request, res: Response) {
    console.log('===== CATEGORIES CONTROLLER - LIST =====');
    console.log('User from auth:', (req as any).user);
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
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      // Adicionar mais detalhes do erro para debugging
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao carregar categorias.',
        details: error.message
      });
    }
  },

  // Criar nova categoria
  async create(req: Request, res: Response) {
    const { name, source_type } = req.body;
    const { db, get, run } = getDatabase();

    try {
      console.log('Creating category with:', { name, source_type });
      // First, get the category_type_id
      const categoryType: any = await get(db, 'SELECT id FROM category_types WHERE name = ?', [source_type]);
      console.log('Found category type:', categoryType);
      if (!categoryType) {
        return res.status(400).json({ error: `Invalid category type: ${source_type}` });
      }

      const result: any = await run(db, 'INSERT INTO categories (name, category_type_id) VALUES (?, ?)', [name, categoryType.id]);
      console.log('Insert result:', result);

      res.status(201).json({ id: result.lastID, name, source_type });
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao criar categoria.' });
    }
  },

  // Atualizar categoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, source_type } = req.body;
    const { db, get, run } = getDatabase();

    try {
      console.log('Updating category with:', { id, name, source_type });
      // First, get the category_type_id
      const categoryType: any = await get(db, 'SELECT id FROM category_types WHERE name = ?', [source_type]);
      console.log('Found category type:', categoryType);
      if (!categoryType) {
        return res.status(400).json({ error: `Invalid category type: ${source_type}` });
      }

      await run(db, 'UPDATE categories SET name = ?, category_type_id = ? WHERE id = ?', [name, categoryType.id, id]);
      console.log('Update completed');

      res.json({ id, name, source_type });
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao atualizar categoria.' });
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
    } catch (error: any) {
      console.error(`Error fetching category with id ${id}:`, error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao buscar categoria.' });
    }
  },

  // Deletar categoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { db, run } = getDatabase();

    try {
      await run(db, 'DELETE FROM categories WHERE id = ?', [id]);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao excluir categoria.' });
    }
  }
};

export default categoriesController;