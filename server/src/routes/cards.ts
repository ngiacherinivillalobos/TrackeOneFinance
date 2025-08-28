import { Router } from 'express';
import CardController from '../controllers/CardController';

const router = Router();

router.get('/', CardController.index);
router.get('/:id', CardController.show);
router.post('/', CardController.create);
router.put('/:id', CardController.update);
router.delete('/:id', CardController.delete);

export default router;
