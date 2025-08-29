import { Router, Request, Response } from 'express';
import { CashFlowController } from '../controllers/CashFlowController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

// Rota de teste simples (sem autenticação para debug)
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Cash Flow API is working!' });
});

// GET /api/cash-flow - Listar todos os registros
router.get('/', authMiddleware, CashFlowController.getAll);

// GET /api/cash-flow/:id - Obter registro específico
router.get('/:id', authMiddleware, CashFlowController.getById);

// POST /api/cash-flow - Criar novo registro
router.post('/', authMiddleware, CashFlowController.create);

// PUT /api/cash-flow/:id - Atualizar registro
router.put('/:id', authMiddleware, CashFlowController.update);

// DELETE /api/cash-flow/:id - Excluir registro
router.delete('/:id', authMiddleware, CashFlowController.delete);

export default router;