import { Router } from 'express';
import CardController from '../controllers/CardController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, CardController.index);
router.get('/:id', authMiddleware, CardController.show);
router.post('/', authMiddleware, CardController.create);
router.put('/:id', authMiddleware, CardController.update);
router.delete('/:id', authMiddleware, CardController.delete);

export default router;
