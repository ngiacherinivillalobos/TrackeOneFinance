import { Router } from 'express';
import { categoryTypesController } from '../controllers/categoryTypesController';

const router = Router();

router.get('/', categoryTypesController.list);
router.post('/', categoryTypesController.create);
router.put('/:id', categoryTypesController.update);
router.delete('/:id', categoryTypesController.delete);

export default router;
