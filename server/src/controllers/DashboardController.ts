import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export const DashboardController = {
  async getOverview(req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      // Get total accounts
      const accountsQuery = 'SELECT COUNT(*) as count FROM bank_accounts';
      const accountsResult = await new Promise<any>((resolve, reject) => {
        db.get(accountsQuery, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      // Get total transactions
      const transactionsQuery = 'SELECT COUNT(*) as count FROM transactions';
      const transactionsResult = await new Promise<any>((resolve, reject) => {
        db.get(transactionsQuery, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      // Get balance (sum of transaction amounts)
      const balanceQuery = 'SELECT SUM(amount) as balance FROM transactions';
      const balanceResult = await new Promise<any>((resolve, reject) => {
        db.get(balanceQuery, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      res.json({
        totalAccounts: accountsResult.count || 0,
        totalTransactions: transactionsResult.count || 0,
        totalBalance: balanceResult.balance || 0
      });
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getRecentTransactions(req: Request, res: Response) {
    try {
      const db = getDatabase();
      const limit = parseInt(req.query.limit as string) || 10;
      
      const query = `
        SELECT t.*, ba.name as account_name, c.name as category_name
        FROM transactions t
        LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT ?
      `;
      
      const transactions = await new Promise<any[]>((resolve, reject) => {
        db.all(query, [limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      res.json(transactions);
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};