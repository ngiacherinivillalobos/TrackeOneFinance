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

// Rotas para pagamento
router.post('/:id/mark-as-paid', authMiddleware, transactionController.markAsPaid);
router.post('/:id/reverse-payment', authMiddleware, transactionController.reversePayment);
router.get('/:id/payment-details', authMiddleware, transactionController.getPaymentDetails);

export default router;
