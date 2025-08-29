import { Router } from 'express';
import subcategoriesController from '../controllers/SubcategoriesController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, subcategoriesController.list);
router.post('/', authMiddleware, subcategoriesController.create);
router.put('/:id', authMiddleware, subcategoriesController.update);
router.delete('/:id', authMiddleware, subcategoriesController.delete);

export default router;
