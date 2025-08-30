import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class CardController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      console.log('CardController.index called - querying cards table');
      const cards = await all(db, 'SELECT * FROM cards ORDER BY name');
      res.json(cards);
    } catch (error) {
      console.error('Error listing cards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get } = getDatabase();
      
      const card = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
      } else {
        res.json(card);
      }
    } catch (error) {
      console.error('Error showing card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, card_number, expiry_date, brand } = req.body;
      const { db, run } = getDatabase();
      
      // Mapeando campos do frontend para campos da tabela
      // card_number pode ser salvo como uma referência no campo de observação
      // vamos usar limit_amount = 0 por padrão e type como brand
      
      const result: any = await run(db, 'INSERT INTO cards (name, type) VALUES (?, ?)', [name, brand || 'Crédito']);
      res.status(201).json({ 
        id: result.lastID, 
        name, 
        card_number,
        expiry_date,
        brand: brand || 'Crédito'
      });
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, card_number, expiry_date, brand } = req.body;
      const { db, run } = getDatabase();
      
      await run(db, 'UPDATE cards SET name = ?, type = ? WHERE id = ?', [name, brand || 'Crédito', id]);
      res.json({ 
        id, 
        name, 
        card_number,
        expiry_date,
        brand: brand || 'Crédito'
      });
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, run } = getDatabase();
      
      await run(db, 'DELETE FROM cards WHERE id = ?', [id]);
      res.json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CardController();