import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class CostCenterController {
  async index(req: Request, res: Response) {
    try {
      const db = getDatabase();
      db.all('SELECT * FROM cost_centers ORDER BY name', (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(rows);
        }
      });
    } catch (error) {
      console.error('Error listing cost centers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.get('SELECT * FROM cost_centers WHERE id = ?', [id], (err: Error | null, row: any) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else if (!row) {
          res.status(404).json({ error: 'Cost center not found' });
        } else {
          res.json(row);
        }
      });
    } catch (error) {
      console.error('Error showing cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, number } = req.body;
      const db = getDatabase();
      
      db.run(
        'INSERT INTO cost_centers (name, number) VALUES (?, ?)',
        [name, number || null],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.status(201).json({ 
              id: this.lastID, 
              name, 
              number: number || null
            });
          }
        }
      );
    } catch (error) {
      console.error('Error creating cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, number } = req.body;
      const db = getDatabase();
      
      db.run(
        'UPDATE cost_centers SET name = ?, number = ? WHERE id = ?',
        [name, number || null, id],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ 
              id, 
              name, 
              number: number || null
            });
          }
        }
      );
    } catch (error) {
      console.error('Error updating cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.run('DELETE FROM cost_centers WHERE id = ?', [id], function(err: Error | null) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.status(204).send();
        }
      });
    } catch (error) {
      console.error('Error deleting cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CostCenterController();
