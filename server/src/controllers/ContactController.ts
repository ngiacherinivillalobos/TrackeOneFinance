import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class ContactController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const contacts = await all(db, 'SELECT * FROM contacts ORDER BY name');
      res.json(contacts);
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get } = getDatabase();
      
      const contact = await get(db, 'SELECT * FROM contacts WHERE id = ?', [id]);
      if (!contact) {
        res.status(404).json({ error: 'Contact not found' });
      } else {
        res.json(contact);
      }
    } catch (error) {
      console.error('Error showing contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const contacts = await all(db, 'SELECT * FROM contacts ORDER BY name');
      res.json(contacts);
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, email, phone } = req.body;
      const { db, run } = getDatabase();
      
      const result: any = await run(db, 'INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);
      res.status(201).json({ id: result.lastID, name, email, phone });
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;
      const { db, run } = getDatabase();
      
      await run(db, 'UPDATE contacts SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, id]);
      res.json({ id, name, email, phone });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, run } = getDatabase();
      
      await run(db, 'DELETE FROM contacts WHERE id = ?', [id]);
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ContactController();