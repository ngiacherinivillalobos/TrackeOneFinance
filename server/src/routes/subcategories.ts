import { Router } from 'express';
import subcategoriesController from '../controllers/SubcategoriesController';

const router = Router();

router.get('/', subcategoriesController.list);
router.post('/', subcategoriesController.create);
router.put('/:id', subcategoriesController.update);
router.delete('/:id', subcategoriesController.delete);

export default router;
