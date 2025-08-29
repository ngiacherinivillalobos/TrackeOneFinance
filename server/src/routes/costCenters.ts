import { Router } from 'express';
import CostCenterController from '../controllers/CostCenterController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, CostCenterController.index);
router.get('/:id', authMiddleware, CostCenterController.show);
router.post('/', authMiddleware, CostCenterController.create);
router.put('/:id', authMiddleware, CostCenterController.update);
router.delete('/:id', authMiddleware, CostCenterController.delete);

export default router;
