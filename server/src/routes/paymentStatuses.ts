import { Router } from 'express';
import paymentStatusesController from '../controllers/paymentStatusesController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, paymentStatusesController.list);
router.post('/', authMiddleware, paymentStatusesController.create);
router.put('/:id', authMiddleware, paymentStatusesController.update);
router.delete('/:id', authMiddleware, paymentStatusesController.delete);

export default router;
