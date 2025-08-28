import { Router } from 'express';
import transactionController from '../controllers/TransactionController';

const router = Router();

console.log('transactionController:', transactionController);
console.log('transactionController.list:', transactionController.list);

router.get('/', transactionController.list);
router.get('/:id', transactionController.getById);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

// Rotas para pagamento
router.post('/:id/mark-as-paid', transactionController.markAsPaid);
router.post('/:id/reverse-payment', transactionController.reversePayment);
router.get('/:id/payment-details', transactionController.getPaymentDetails);

export default router;
