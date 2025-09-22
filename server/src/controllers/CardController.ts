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
      const { name, card_number, expiry_date, brand, closing_day, due_day } = req.body;
      const { db, run, get } = getDatabase();
      
      // Agora salvando todos os campos do cartão
      const result: any = await run(db, 'INSERT INTO cards (name, type, card_number, expiry_date, brand, closing_day, due_day) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, brand || 'Crédito', card_number, expiry_date, brand, closing_day || 15, due_day || 10]);
      
      // Buscar o cartão recém-criado para retornar os dados corretos
      const createdCard = await get(db, 'SELECT * FROM cards WHERE id = ?', [result.lastID]);
      
      res.status(201).json(createdCard);
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, card_number, expiry_date, brand, closing_day, due_day } = req.body;
      const { db, run, get } = getDatabase();
      
      // Agora atualizando todos os campos do cartão
      await run(db, 'UPDATE cards SET name = ?, type = ?, card_number = ?, expiry_date = ?, brand = ?, closing_day = ?, due_day = ? WHERE id = ?', [name, brand || 'Crédito', card_number, expiry_date, brand, closing_day || 15, due_day || 10, id]);
      
      // Buscar o cartão atualizado para retornar os dados corretos
      const updatedCard = await get(db, 'SELECT * FROM cards WHERE id = ?', [id]);
      
      res.json(updatedCard);
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