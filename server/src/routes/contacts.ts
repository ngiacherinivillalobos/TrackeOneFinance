import { Router } from 'express';
import ContactController from '../controllers/ContactController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

router.get('/', authMiddleware, ContactController.index);
router.get('/:id', authMiddleware, ContactController.show);
router.post('/', authMiddleware, ContactController.create);
router.put('/:id', authMiddleware, ContactController.update);
router.delete('/:id', authMiddleware, ContactController.delete);

export default router;
