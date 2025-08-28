import { Router } from 'express';
import BankAccountController from '../controllers/BankAccountController';

const router = Router();

router.get('/', BankAccountController.index);
router.get('/:id', BankAccountController.show);
router.post('/', BankAccountController.create);
router.put('/:id', BankAccountController.update);
router.delete('/:id', BankAccountController.delete);

export default router;
