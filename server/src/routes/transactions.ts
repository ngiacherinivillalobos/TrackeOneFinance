import { Router } from 'express';
import transactionController from '../controllers/TransactionController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/filtered', authMiddleware, transactionController.getFilteredTransactions);
router.get('/', authMiddleware, transactionController.list);
router.get('/:id', authMiddleware, transactionController.getById);
router.post('/', authMiddleware, transactionController.create);
router.put('/:id', authMiddleware, transactionController.update);
router.patch('/:id', authMiddleware, transactionController.patch); // Nova rota para edição em lote
router.delete('/:id', authMiddleware, transactionController.delete);

// Rota para edição em lote
router.post('/batch-edit', authMiddleware, transactionController.batchEdit);

// Debug endpoint temporário - REMOVER DEPOIS
router.get('/debug/test-fixes', async (req: any, res: any) => {
  try {
    const { getDatabase } = require('../database/connection');
    const { db, all } = getDatabase();
    
    // Teste PostgreSQL vs SQLite
    const isProduction = process.env.NODE_ENV === 'production';
    const dbType = isProduction ? 'PostgreSQL' : 'SQLite';
    
    // Teste se coluna is_paid existe
    let columnCheck;
    try {
      if (isProduction) {
        columnCheck = await all(db, "SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_paid'");
      } else {
        columnCheck = await all(db, "PRAGMA table_info(transactions)");
        columnCheck = columnCheck.find((col: any) => col.name === 'is_paid');
      }
    } catch (e) {
      columnCheck = { error: e.message };
    }
    
    res.json({
      environment: process.env.NODE_ENV,
      database_type: dbType,
      is_paid_column_exists: columnCheck,
      timestamp: new Date().toISOString(),
      fixes_status: {
        fix1_is_paid_logic: 'IMPLEMENTED',
        fix2_postgresql_dates: 'IMPLEMENTED', 
        fix3_createSafeDate: 'IMPLEMENTED'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas para pagamento
router.post('/:id/mark-as-paid', authMiddleware, transactionController.markAsPaid);
router.post('/:id/reverse-payment', authMiddleware, transactionController.reversePayment);
router.get('/:id/payment-details', authMiddleware, transactionController.getPaymentDetails);

export default router;
