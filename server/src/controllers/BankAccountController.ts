import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

class BankAccountController {
  async index(req: Request, res: Response) {
    try {
      const { db, all } = getDatabase();
      const bankAccounts = await all(db, 'SELECT *, initial_balance as balance FROM bank_accounts ORDER BY name');
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
      const bankAccounts = await all(db, 'SELECT *, initial_balance as balance FROM bank_accounts ORDER BY name');
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error listing bank accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, account_number, bank_name, agency, balance = 0 } = req.body;
      const { db, run } = getDatabase();
      
      const result: any = await run(db, 'INSERT INTO bank_accounts (name, account_number, type, agency, initial_balance, current_balance) VALUES (?, ?, ?, ?, ?, ?)', 
        [name, account_number || null, bank_name || 'Conta Corrente', agency || null, balance, balance]);
      
      res.status(201).json({ 
        id: result.lastID, 
        name, 
        account_number: account_number || null,
        bank_name: bank_name || 'Conta Corrente',
        agency: agency || null,
        balance: balance
      });
    } catch (error) {
      console.error('Error creating bank account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, account_number, bank_name, agency, balance } = req.body;
      const { db, run } = getDatabase();
      
      await run(db, 'UPDATE bank_accounts SET name = ?, account_number = ?, type = ?, agency = ?, initial_balance = ?, current_balance = ? WHERE id = ?', 
        [name, account_number || null, bank_name || 'Conta Corrente', agency || null, balance || 0, balance || 0, id]);
      
      res.json({ 
        id, 
        name, 
        account_number: account_number || null,
        bank_name: bank_name || 'Conta Corrente',
        agency: agency || null,
        balance: balance || 0
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

  async getBankAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { db, get, all } = getDatabase();
      
      // Buscar conta bancária
      const bankAccount = await get(db, 'SELECT * FROM bank_accounts WHERE id = ?', [id]);
      if (!bankAccount) {
        return res.status(404).json({ error: 'Bank account not found' });
      }

      // Calcular movimentações (receitas - despesas) para esta conta
      const movements = await all(db, `
        SELECT 
          SUM(CASE WHEN CAST(type AS TEXT) = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN CAST(type AS TEXT) = 'expense' THEN amount ELSE 0 END) as total_expense
        FROM transactions 
        WHERE bank_account_id = ?
      `, [id]);

      const totalIncome = parseFloat(movements[0]?.total_income || '0');
      const totalExpense = parseFloat(movements[0]?.total_expense || '0');
      const totalMovements = totalIncome - totalExpense;
      const currentBalance = parseFloat(bankAccount.balance || '0') + totalMovements;

      res.json({
        ...bankAccount,
        bank_name: bankAccount.type || bankAccount.bank_name,
        initial_balance: parseFloat(bankAccount.balance || '0'),
        current_balance: currentBalance,
        total_movements: totalMovements
      });
    } catch (error) {
      console.error('Error getting bank account balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBankAccountsWithBalances(req: Request, res: Response) {
    try {
      console.log('=== getBankAccountsWithBalances - START ===');
      const { db, all } = getDatabase();
      
      // Buscar todas as contas bancárias
      console.log('Fetching bank accounts...');
      const bankAccounts = await all(db, 'SELECT * FROM bank_accounts ORDER BY name');
      console.log('Found bank accounts:', bankAccounts?.length || 0);

      // Calcular saldo atual para cada conta
      const accountsWithBalances = await Promise.all(
        bankAccounts.map(async (account: any) => {
          console.log(`Processing account ${account.id} - ${account.name}`);
          
          // Verificar se estamos em produção (PostgreSQL) ou desenvolvimento (SQLite)
          const isProduction = process.env.NODE_ENV === 'production';
          
          let movementsQuery;
          if (isProduction) {
            // PostgreSQL - não precisa de CAST para enums
            movementsQuery = `
              SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
              FROM transactions 
              WHERE bank_account_id = ?
            `;
          } else {
            // SQLite
            movementsQuery = `
              SELECT 
                SUM(CASE WHEN CAST(type AS TEXT) = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN CAST(type AS TEXT) = 'expense' THEN amount ELSE 0 END) as total_expense
              FROM transactions 
              WHERE bank_account_id = ?
            `;
          }
          
          const movements = await all(db, movementsQuery, [account.id]);

          console.log(`Movements for account ${account.id}:`, movements[0]);

          const totalIncome = parseFloat(movements[0]?.total_income || '0');
          const totalExpense = parseFloat(movements[0]?.total_expense || '0');
          const totalMovements = totalIncome - totalExpense;
          const initialBalance = parseFloat(account.initial_balance || account.balance || '0');
          const currentBalance = initialBalance + totalMovements;

          console.log(`Account ${account.id} - Balance calculation:`, {
            initialBalance,
            totalIncome,
            totalExpense,
            totalMovements,
            currentBalance
          });

          return {
            ...account,
            bank_name: account.type || account.bank_name,
            initial_balance: initialBalance,
            current_balance: currentBalance,
            total_movements: totalMovements
          };
        })
      );

      console.log('=== getBankAccountsWithBalances - SUCCESS ===');
      res.json(accountsWithBalances);
    } catch (error) {
      console.error('=== getBankAccountsWithBalances - ERROR ===');
      console.error('Error getting bank accounts with balances:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export default new BankAccountController();