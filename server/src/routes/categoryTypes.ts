import { Router } from 'express';
import { categoryTypesController } from '../controllers/categoryTypesController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, categoryTypesController.list);
router.post('/', authMiddleware, categoryTypesController.create);
router.put('/:id', authMiddleware, categoryTypesController.update);
router.delete('/:id', authMiddleware, categoryTypesController.delete);

export default router;
