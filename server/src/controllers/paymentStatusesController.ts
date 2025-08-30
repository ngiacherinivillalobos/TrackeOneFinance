import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const paymentStatusesController = {
  async list(req: Request, res: Response) {
    const { db, all } = getDatabase();
    try {
      const statuses = await all(db, 'SELECT * FROM payment_status ORDER BY name');
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching payment statuses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    const { name } = req.body;
    const { db, run } = getDatabase();

    try {
      const result: any = await run(db, 'INSERT INTO payment_status (name) VALUES (?)', [name]);
      res.status(201).json({ id: result.lastID, name });
    } catch (error) {
      console.error('Error creating payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;
    const { db, run } = getDatabase();

    try {
      await run(db, 'UPDATE payment_status SET name = ? WHERE id = ?', [name, id]);
      res.json({ id, name });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { db, run } = getDatabase();

    try {
      await run(db, 'DELETE FROM payment_status WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default paymentStatusesController;