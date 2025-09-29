import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

const debugController = {
  // Diagnosticar problemas de tipos no banco
  async diagnoseTypes(req: Request, res: Response) {
    try {
      console.log('🔍 Iniciando diagnóstico de tipos...');
      const { db, all } = getDatabase();
      const results: any = {};
      
      // Verificar se estamos no PostgreSQL
      const isPostgres = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('postgres');
      results.isPostgres = isPostgres;
      
      if (!isPostgres) {
        return res.json({ message: 'Diagnóstico apenas disponível para PostgreSQL', results });
      }
      
      // Verificar estrutura das tabelas
      const tables = ['categories', 'subcategories', 'transactions', 'payment_status', 'cost_centers'];
      results.tableStructures = {};
      
      for (const table of tables) {
        try {
          const columns = await all(db, `
            SELECT 
              column_name, 
              data_type, 
              is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [table]);
          
          results.tableStructures[table] = columns;
        } catch (error) {
          results.tableStructures[table] = { error: error.message };
        }
      }
      
      // Verificar dados de exemplo das tabelas críticas
      results.sampleData = {};
      
      try {
        // Categorias
        const categories = await all(db, 'SELECT * FROM categories LIMIT 3');
        results.sampleData.categories = categories;
        
        // Subcategorias
        const subcategories = await all(db, 'SELECT * FROM subcategories LIMIT 3');
        results.sampleData.subcategories = subcategories;
        
        // Transações
        const transactions = await all(db, 'SELECT id, category_id, subcategory_id, payment_status_id, cost_center_id FROM transactions LIMIT 3');
        results.sampleData.transactions = transactions;
        
      } catch (error) {
        results.sampleDataError = error.message;
      }
      
      // Testar queries problemáticas
      results.queryTests = {};
      
      try {
        // Testar query do BankAccountController - APENAS conta corrente
        console.log('Testando query de bank accounts...');
        const bankAccountTest = await all(db, `
          SELECT 
            SUM(CASE WHEN type = 'income' 
              AND (is_paid = 1 OR payment_status_id = 2)
              AND (payment_type IS NULL OR payment_type = 'bank_account')
              AND payment_type NOT IN ('credit_card', 'credit')
              THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' 
              AND (is_paid = 1 OR payment_status_id = 2)
              AND (payment_type IS NULL OR payment_type = 'bank_account')
              AND payment_type NOT IN ('credit_card', 'credit')
              THEN amount ELSE 0 END) as total_expense
          FROM transactions 
          WHERE bank_account_id = $1
        `, [1]);
        
        results.queryTests.bankAccountQuery = { success: true, result: bankAccountTest };
      } catch (error) {
        results.queryTests.bankAccountQuery = { success: false, error: error.message };
      }
      
      try {
        // Testar query de categorias
        console.log('Testando query de categorias...');
        const categoriesTest = await all(db, `
          SELECT 
            c.id,
            c.name,
            ct.name as source_type,
            c.category_type_id,
            c.created_at
          FROM categories c
          LEFT JOIN category_types ct ON c.category_type_id = ct.id
          ORDER BY c.name
          LIMIT 3
        `);
        
        results.queryTests.categoriesQuery = { success: true, result: categoriesTest };
      } catch (error) {
        results.queryTests.categoriesQuery = { success: false, error: error.message };
      }
      
      console.log('Diagnóstico concluído:', results);
      res.json(results);
      
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default debugController;