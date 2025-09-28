import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class CardController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      console.log('CardController.index called - querying cards table');
      const cards = await all(db, 'SELECT * FROM cards ORDER BY name');
      res.json(cards);
    } catch (error: any) {
      console.error('Error listing cards:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao carregar cartões.' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get } = getDatabase();
      
      const card = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      if (!card) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      } else {
        res.json(card);
      }
    } catch (error: any) {
      console.error('Error showing card:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao buscar cartão.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, card_number, expiry_date, brand, closing_day, due_day } = req.body;
      const { db, run, get } = getDatabase();
      
      // Verificar se estamos em produção (PostgreSQL) ou desenvolvimento (SQLite)
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Para PostgreSQL, usar INSERT sem card_type para evitar erro
        const result: any = await run(db, 'INSERT INTO cards (name, card_number, expiry_date, brand, closing_day, due_day) VALUES (?, ?, ?, ?, ?, ?)', [name, card_number, expiry_date, brand, closing_day || 15, due_day || 10]);
        
        // Buscar o cartão recém-criado para retornar os dados corretos
        const createdCard = await get(db, 'SELECT * FROM cards WHERE id = ?', [result.lastID || result.rows[0].id]);
        
        res.status(201).json(createdCard);
      } else {
        // Para SQLite, usar os nomes originais
        const result: any = await run(db, 'INSERT INTO cards (name, type, card_number, expiry_date, brand, closing_day, due_day) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, brand || 'Crédito', card_number, expiry_date, brand, closing_day || 15, due_day || 10]);
        
        // Buscar o cartão recém-criado para retornar os dados corretos
        const createdCard = await get(db, 'SELECT * FROM cards WHERE id = ?', [result.lastID]);
        
        res.status(201).json(createdCard);
      }
    } catch (error: any) {
      console.error('Error creating card:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao criar cartão.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, card_number, expiry_date, brand, closing_day, due_day } = req.body;
      const { db, run, get } = getDatabase();
      
      console.log('Atualizando cartão com dados:', { id, name, card_number, expiry_date, brand, closing_day, due_day });
      
      // Verificar se o cartão existe antes de atualizar
      const existingCard: any = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      if (!existingCard) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      }
      
      // Verificar se estamos em produção (PostgreSQL) ou desenvolvimento (SQLite)
      const isProduction = process.env.NODE_ENV === 'production';
      
      console.log('Environment:', process.env.NODE_ENV, 'IsProduction:', isProduction);
      
      try {
        if (isProduction) {
          // Para PostgreSQL, usar UPDATE sem card_type para evitar erro
          await run(db, 
            'UPDATE cards SET name = ?, card_number = ?, expiry_date = ?, brand = ?, closing_day = ?, due_day = ? WHERE id = ?', 
            [name, card_number, expiry_date, brand, closing_day || 15, due_day || 10, id]
          );
        } else {
          // Para SQLite, usar os nomes originais
          await run(db, 
            'UPDATE cards SET name = ?, type = ?, card_number = ?, expiry_date = ?, brand = ?, closing_day = ?, due_day = ? WHERE id = ?', 
            [name, brand || 'Crédito', card_number, expiry_date, brand, closing_day || 15, due_day || 10, id]
          );
        }
        
        console.log('Update executado com sucesso');
      } catch (updateError: any) {
        console.error('Erro específico no UPDATE:', updateError);
        throw updateError;
      }
      
      // Buscar o cartão atualizado para retornar os dados corretos
      const updatedCard = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      
      console.log('Cartão atualizado:', updatedCard);
      res.json(updatedCard);
    } catch (error: any) {
      console.error('Error updating card:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail
      });
      
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      
      // Adicionar mais detalhes do erro para debugging
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao atualizar cartão.',
        details: error.message,
        code: error.code || 'UNKNOWN'
      });
    }
  }

  async fixCardNumberLength(req: Request, res: Response) {
    try {
      const { db, run, all } = getDatabase();
      
      console.log('🔧 Aplicando correção no campo card_number...');
      
      // Verificar se estamos em produção (PostgreSQL)
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        try {
          // Para PostgreSQL, alterar tipo da coluna
          await run(db, 'ALTER TABLE cards ALTER COLUMN card_number TYPE VARCHAR(20);');
          console.log('✅ Correção aplicada: card_number agora suporta 20 caracteres');
          
          // Verificar se foi aplicada
          const result = await all(db, `
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'cards' AND column_name = 'card_number';
          `);
          
          res.json({
            success: true,
            message: 'Correção aplicada com sucesso',
            columnInfo: result[0] || null
          });
        } catch (dbError: any) {
          console.error('Erro ao aplicar correção:', dbError);
          res.status(500).json({
            success: false,
            error: 'Erro ao aplicar correção no banco',
            details: dbError.message
          });
        }
      } else {
        res.json({
          success: false,
          message: 'Correção não necessária em ambiente de desenvolvimento'
        });
      }
    } catch (error: any) {
      console.error('Error in fixCardNumberLength:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, run } = getDatabase();
      
      // Verificar se o cartão existe antes de deletar
      const { get } = getDatabase();
      const existingCard: any = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      if (!existingCard) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      }
      
      await run(db, 'DELETE FROM cards WHERE id = ?', [id]);
      res.json({ message: 'Cartão excluído com sucesso' });
    } catch (error: any) {
      console.error('Error deleting card:', error);
      // Tratar erros específicos
      if (error.message?.includes('timeout') || error.message?.includes('Connection')) {
        return res.status(503).json({ error: 'Serviço temporariamente indisponível. Por favor, tente novamente.' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao excluir cartão.' });
    }
  }
}

export default new CardController();