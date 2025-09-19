import { Router } from 'express';
import creditCardTransactionController from '../controllers/CreditCardTransactionController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, creditCardTransactionController.list);
router.get('/:id', authMiddleware, creditCardTransactionController.getById);
router.post('/', authMiddleware, creditCardTransactionController.create);
router.put('/:id', authMiddleware, creditCardTransactionController.update);
router.delete('/:id', authMiddleware, creditCardTransactionController.delete);

// Rotas para parcelamento
router.post('/installments', authMiddleware, creditCardTransactionController.createInstallments);

export default router;