import { Router } from 'express';
import BankAccountController from '../controllers/BankAccountController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, BankAccountController.index);
router.get('/:id', authMiddleware, BankAccountController.show);
router.post('/', authMiddleware, BankAccountController.create);
router.put('/:id', authMiddleware, BankAccountController.update);
router.delete('/:id', authMiddleware, BankAccountController.delete);

export default router;
