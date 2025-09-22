import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const subcategoriesController = {
  // Listar todas as subcategorias ou de uma categoria específica
  async list(req: Request, res: Response) {
    const { categoryId } = req.query;
    const { db, all } = getDatabase();

    try {
      console.log('Fetching subcategories with categoryId:', categoryId);
      let query = 'SELECT * FROM subcategories';
      let params: any[] = [];

      if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
      }
      
      query += ' ORDER BY name';
      console.log('Query:', query, 'Params:', params);

      const subcategories = await all(db, query, params);
      console.log('Found subcategories:', subcategories);
      res.json(subcategories);
    } catch (error: any) {
      console.error('Error fetching subcategories:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      // Adicionar mais detalhes do erro para debugging
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao carregar subcategorias.',
        details: error.message
      });
    }
  },

  // Criar nova subcategoria
  async create(req: Request, res: Response) {
    const { name, category_id } = req.body;
    const { db, run } = getDatabase();

    try {
      console.log('Creating subcategory with:', { name, category_id });
      const result: any = await run(db, 'INSERT INTO subcategories (name, category_id) VALUES (?, ?)', [name, category_id || null]);
      console.log('Insert result:', result);
      res.status(201).json({ id: result.lastID, name, category_id: category_id || null });
    } catch (error: any) {
      console.error('Error creating subcategory:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao criar subcategoria.' });
    }
  },

  // Atualizar subcategoria
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, category_id } = req.body;
    const { db, run } = getDatabase();

    try {
      console.log('Updating subcategory with:', { id, name, category_id });
      await run(db, 'UPDATE subcategories SET name = ?, category_id = ? WHERE id = ?', [name, category_id || null, id]);
      console.log('Update completed');
      res.json({ id, name, category_id: category_id || null });
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao atualizar subcategoria.' });
    }
  },

  // Deletar subcategoria
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { db, run } = getDatabase();

    try {
      await run(db, 'DELETE FROM subcategories WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao excluir subcategoria.' });
    }
  }
};

export default subcategoriesController;