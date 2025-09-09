import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class CostCenterController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const costCenters = await all(db, 'SELECT * FROM cost_centers ORDER BY name');
      res.json(costCenters);
    } catch (error) {
      console.error('Error listing cost centers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get } = getDatabase();
      
      const costCenter = await get(db, 'SELECT * FROM cost_centers WHERE id = ?', [id]);
      if (!costCenter) {
        res.status(404).json({ error: 'Cost center not found' });
      } else {
        res.json(costCenter);
      }
    } catch (error) {
      console.error('Error showing cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, number, payment_days } = req.body;
      console.log('Creating cost center with data:', { name, number, payment_days });
      const { db, run } = getDatabase();
      
      // Para PostgreSQL, usar RETURNING id para obter o ID inserido
      const isProduction = process.env.NODE_ENV === 'production';
      const query = isProduction 
        ? 'INSERT INTO cost_centers (name, number, payment_days) VALUES (?, ?, ?) RETURNING id'
        : 'INSERT INTO cost_centers (name, number, payment_days) VALUES (?, ?, ?)';
      
      const result: any = await run(db, query, [name, number || null, payment_days || null]);
      console.log('Database result:', result);
      
      const insertedId = isProduction ? result.lastID : result.lastID;
      
      res.status(201).json({ 
        id: insertedId, 
        name, 
        number: number || null,
        payment_days: payment_days || null
      });
    } catch (error) {
      console.error('Error creating cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, number, payment_days } = req.body;
      const { db, run } = getDatabase();
      
      await run(db, 'UPDATE cost_centers SET name = ?, number = ?, payment_days = ? WHERE id = ?', [name, number || null, payment_days || null, id]);
      res.json({ 
        id, 
        name, 
        number: number || null,
        payment_days: payment_days || null
      });
    } catch (error) {
      console.error('Error updating cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, run } = getDatabase();
      
      await run(db, 'DELETE FROM cost_centers WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting cost center:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CostCenterController();