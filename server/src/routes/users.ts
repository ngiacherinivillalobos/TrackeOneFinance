import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

// Todas as rotas de usuários requerem autenticação
router.use(authMiddleware);

// Rotas para gerenciamento de usuários
router.get('/', userController.list);
router.post('/', userController.create);
router.delete('/:id', userController.delete);
router.put('/:id/password', userController.resetPassword);
router.put('/:id/cost-center', userController.updateCostCenter);

export default router;