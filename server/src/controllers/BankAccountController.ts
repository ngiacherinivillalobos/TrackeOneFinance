import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class BankAccountController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const bankAccounts = await all(db, 'SELECT * FROM bank_accounts ORDER BY name');
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error listing bank accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get } = getDatabase();
      
      const bankAccount = await get(db, 'SELECT * FROM bank_accounts WHERE id = ?', [id]);
      if (!bankAccount) {
        res.status(404).json({ error: 'Bank account not found' });
      } else {
        res.json(bankAccount);
      }
    } catch (error) {
      console.error('Error showing bank account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const bankAccounts = await all(db, 'SELECT * FROM bank_accounts ORDER BY name');
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error listing bank accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, account_number, bank_name, agency } = req.body;
      const { db, run } = getDatabase();
      
      const result: any = await run(db, 'INSERT INTO bank_accounts (name, account_number, type, agency) VALUES (?, ?, ?, ?)', 
        [name, account_number || null, bank_name || 'Conta Corrente', agency || null]);
      
      res.status(201).json({ 
        id: result.lastID, 
        name, 
        account_number: account_number || null,
        bank_name: bank_name || 'Conta Corrente',
        agency: agency || null
      });
    } catch (error) {
      console.error('Error creating bank account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, account_number, bank_name, agency } = req.body;
      const { db, run } = getDatabase();
      
      await run(db, 'UPDATE bank_accounts SET name = ?, account_number = ?, type = ?, agency = ? WHERE id = ?', 
        [name, account_number || null, bank_name || 'Conta Corrente', agency || null, id]);
      
      res.json({ 
        id, 
        name, 
        account_number: account_number || null,
        bank_name: bank_name || 'Conta Corrente',
        agency: agency || null
      });
    } catch (error) {
      console.error('Error updating bank account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, run } = getDatabase();
      
      await run(db, 'DELETE FROM bank_accounts WHERE id = ?', [id]);
      res.json({ message: 'Bank account deleted successfully' });
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new BankAccountController();