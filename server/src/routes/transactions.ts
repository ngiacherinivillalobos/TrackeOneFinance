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

// Debug endpoint temporário para verificar migração
router.get('/debug/migration', async (req: any, res: any) => {
  try {
    const { db, all } = require('../database/connection').getDatabase();
    
    // Verificar se a coluna is_paid existe
    const result = await all(db, `
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='transactions'
      UNION ALL
      SELECT column_name as sql FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'is_paid'
    `);
    
    res.json({
      environment: process.env.NODE_ENV,
      database_type: process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite',
      migration_check: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Migration check failed', details: error.message });
  }
});

// Rotas para pagamento
router.post('/:id/mark-as-paid', authMiddleware, transactionController.markAsPaid);
router.post('/:id/reverse-payment', authMiddleware, transactionController.reversePayment);
router.get('/:id/payment-details', authMiddleware, transactionController.getPaymentDetails);

export default router;
