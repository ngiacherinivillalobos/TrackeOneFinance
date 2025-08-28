import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class CardController {
  async index(req: Request, res: Response) {
    try {
      const db = getDatabase();
      console.log('CardController.index called - querying cards table');
      db.all('SELECT * FROM cards ORDER BY name', (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          console.log('Cards found:', rows.length, 'records');
          res.json(rows);
        }
      });
    } catch (error) {
      console.error('Error listing cards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.get('SELECT * FROM cards WHERE id = ?', [id], (err: Error | null, row: any) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else if (!row) {
          res.status(404).json({ error: 'Card not found' });
        } else {
          res.json(row);
        }
      });
    } catch (error) {
      console.error('Error showing card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, card_number, expiry_date, brand } = req.body;
      const db = getDatabase();
      
      // Mapeando campos do frontend para campos da tabela
      // card_number pode ser salvo como uma referência no campo de observação
      // vamos usar limit_amount = 0 por padrão e type como brand
      
      db.run(
        'INSERT INTO cards (name, type) VALUES (?, ?)',
        [name, brand || 'Crédito'],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.status(201).json({ 
              id: this.lastID, 
              name, 
              card_number,
              expiry_date,
              brand: brand || 'Crédito'
            });
          }
        }
      );
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, card_number, expiry_date, brand } = req.body;
      const db = getDatabase();
      
      db.run(
        'UPDATE cards SET name = ?, type = ? WHERE id = ?',
        [name, brand || 'Crédito', id],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ 
              id, 
              name, 
              card_number,
              expiry_date,
              brand: brand || 'Crédito'
            });
          }
        }
      );
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.run('DELETE FROM cards WHERE id = ?', [id], function(err: Error | null) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Card deleted successfully' });
        }
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CardController();
