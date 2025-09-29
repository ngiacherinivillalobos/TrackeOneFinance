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
      
      console.log(`=== getBankAccountBalance - START for account ${id} ===`);
      
      // Buscar conta bancária
      const bankAccount = await get(db, 'SELECT * FROM bank_accounts WHERE id = ?', [id]);
      if (!bankAccount) {
        console.log(`Account ${id} not found`);
        return res.status(404).json({ error: 'Bank account not found' });
      }
      
      console.log(`Account found:`, bankAccount);

      // Verificar se estamos em produção (PostgreSQL) ou desenvolvimento (SQLite)
      const isProduction = process.env.NODE_ENV === 'production';
      console.log(`Environment: ${isProduction ? 'Production (PostgreSQL)' : 'Development (SQLite)'}`);
      
      let movementsQuery;
      let queryParams;
      if (isProduction) {
        // PostgreSQL - apenas transações pagas com forma de pagamento conta corrente
        movementsQuery = `
          SELECT 
            COALESCE((SELECT SUM(amount::numeric) FROM transactions WHERE bank_account_id = $1 AND type::text = 'income' AND is_paid = true AND (payment_type = 'bank_account' OR payment_type IS NULL)), 0) as total_income,
            COALESCE((SELECT SUM(amount::numeric) FROM transactions WHERE bank_account_id = $1 AND type::text = 'expense' AND is_paid = true AND (payment_type = 'bank_account' OR payment_type IS NULL)), 0) as total_expense
        `;
        queryParams = [id];
        console.log('Using PostgreSQL query (only bank_account payments) with params:', queryParams);
      } else {
        // SQLite - apenas transações pagas com forma de pagamento conta corrente
        movementsQuery = `
          SELECT 
            COALESCE(SUM(CASE WHEN CAST(type AS TEXT) = 'income' AND is_paid = 1 AND (payment_type = 'bank_account' OR payment_type IS NULL) THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN CAST(type AS TEXT) = 'expense' AND is_paid = 1 AND (payment_type = 'bank_account' OR payment_type IS NULL) THEN amount ELSE 0 END), 0) as total_expense
          FROM transactions 
          WHERE bank_account_id = ? AND type IS NOT NULL
        `;
        queryParams = [id];
        console.log('Using SQLite query (only bank_account payments) with params:', queryParams);
      }
      
      console.log('Executing movements query:', movementsQuery, 'with params:', queryParams);
      
      // Calcular movimentações (receitas - despesas) para esta conta
      const movements = await all(db, movementsQuery, queryParams);
      
      console.log('Movements result:', movements);

      const totalIncome = parseFloat(movements[0]?.total_income || '0');
      const totalExpense = parseFloat(movements[0]?.total_expense || '0');
      const totalMovements = totalIncome - totalExpense;
      const currentBalance = parseFloat(bankAccount.balance || '0') + totalMovements;

      console.log('=== getBankAccountBalance - SUCCESS ===');
      res.json({
        ...bankAccount,
        bank_name: bankAccount.type || bankAccount.bank_name,
        initial_balance: parseFloat(bankAccount.balance || '0'),
        current_balance: currentBalance,
        total_movements: totalMovements
      });
    } catch (error) {
      console.error('=== getBankAccountBalance - ERROR ===');
      console.error('Error getting bank account balance:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
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
          console.log(`Environment for account ${account.id}: ${isProduction ? 'Production (PostgreSQL)' : 'Development (SQLite)'}`);
          
          let movementsQuery;
          let queryParams;
          if (isProduction) {
            // PostgreSQL - apenas transações pagas com forma de pagamento conta corrente
            movementsQuery = `
              SELECT 
                COALESCE((SELECT SUM(amount::numeric) FROM transactions WHERE bank_account_id = $1 AND type::text = 'income' AND is_paid = true AND (payment_type = 'bank_account' OR payment_type IS NULL)), 0) as total_income,
                COALESCE((SELECT SUM(amount::numeric) FROM transactions WHERE bank_account_id = $1 AND type::text = 'expense' AND is_paid = true AND (payment_type = 'bank_account' OR payment_type IS NULL)), 0) as total_expense
            `;
            queryParams = [account.id];
            console.log(`Using PostgreSQL query (only bank_account payments) for account ${account.id} with params:`, queryParams);
          } else {
            // SQLite - apenas transações pagas com forma de pagamento conta corrente
            movementsQuery = `
              SELECT 
                COALESCE(SUM(CASE WHEN CAST(type AS TEXT) = 'income' AND is_paid = 1 AND (payment_type = 'bank_account' OR payment_type IS NULL) THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN CAST(type AS TEXT) = 'expense' AND is_paid = 1 AND (payment_type = 'bank_account' OR payment_type IS NULL) THEN amount ELSE 0 END), 0) as total_expense
              FROM transactions 
              WHERE bank_account_id = ? AND type IS NOT NULL
            `;
            queryParams = [account.id];
            console.log(`Using SQLite query (only bank_account payments) for account ${account.id} with params:`, queryParams);
          }
          
          console.log(`Executing movements query for account ${account.id}:`, movementsQuery);
          
          try {
            const movements = await all(db, movementsQuery, queryParams);
            console.log(`Movements result for account ${account.id}:`, movements[0]);

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
          } catch (queryError) {
            console.error(`Error executing query for account ${account.id}:`, queryError);
            throw queryError;
          }
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