import { Router } from 'express';
import { savingsGoalController } from '../controllers/SavingsGoalController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

// Todas as rotas de metas de economia requerem autenticação
router.use(authMiddleware);

// Rotas para gerenciamento de metas de economia
router.get('/', savingsGoalController.get);
router.post('/', savingsGoalController.save);

export default router;