import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class ContactController {
  async index(req: Request, res: Response) {
    try {
      const db = getDatabase();
      db.all('SELECT * FROM contacts ORDER BY name', (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(rows);
        }
      });
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.get('SELECT * FROM contacts WHERE id = ?', [id], (err: Error | null, row: any) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else if (!row) {
          res.status(404).json({ error: 'Contact not found' });
        } else {
          res.json(row);
        }
      });
    } catch (error) {
      console.error('Error showing contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const db = getDatabase();
      db.all('SELECT * FROM contacts ORDER BY name', (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(rows);
        }
      });
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, email, phone } = req.body;
      const db = getDatabase();
      
      db.run(
        'INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.status(201).json({ id: this.lastID, name, email, phone });
          }
        }
      );
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;
      const db = getDatabase();
      
      db.run(
        'UPDATE contacts SET name = ?, email = ?, phone = ? WHERE id = ?',
        [name, email, phone, id],
        function(err: Error | null) {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ id, name, email, phone });
          }
        }
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      db.run('DELETE FROM contacts WHERE id = ?', [id], function(err: Error | null) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Contact deleted successfully' });
        }
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ContactController();
