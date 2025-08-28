import { Router } from 'express';
import CostCenterController from '../controllers/CostCenterController';

const router = Router();

router.get('/', CostCenterController.index);
router.get('/:id', CostCenterController.show);
router.post('/', CostCenterController.create);
router.put('/:id', CostCenterController.update);
router.delete('/:id', CostCenterController.delete);

export default router;
