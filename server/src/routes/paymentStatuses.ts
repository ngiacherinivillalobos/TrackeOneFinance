import { Router } from 'express';
import paymentStatusesController from '../controllers/paymentStatusesController';

const router = Router();

router.get('/', paymentStatusesController.list);
router.post('/', paymentStatusesController.create);
router.put('/:id', paymentStatusesController.update);
router.delete('/:id', paymentStatusesController.delete);

export default router;
