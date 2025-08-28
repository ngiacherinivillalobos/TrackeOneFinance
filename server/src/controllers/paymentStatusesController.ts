import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const paymentStatusesController = {
  async list(req: Request, res: Response) {
    const db = getDatabase();
    try {
      const statuses = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM payment_status ORDER BY name', [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching payment statuses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    const { name } = req.body;
    const db = getDatabase();

    try {
      const result: any = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO payment_status (name) VALUES (?)',
          [name],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      res.status(201).json({ id: result.id, name });
    } catch (error) {
      console.error('Error creating payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE payment_status SET name = ? WHERE id = ?',
          [name, id],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      res.json({ id, name });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = getDatabase();

    try {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM payment_status WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting payment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default paymentStatusesController;
