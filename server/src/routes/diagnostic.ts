import express from 'express';
import { authMiddleware } from '../controllers/authMiddleware';
import DiagnosticController from '../controllers/DiagnosticController';

const router = express.Router();

// Rota de diagnóstico (apenas em produção/desenvolvimento)
router.get('/types', authMiddleware, DiagnosticController.diagnoseTypes);

export default router;