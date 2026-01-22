import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../controllers/authMiddleware';

console.log('Loading auth routes...');

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/validate', authMiddleware, (req, res) => {
  console.log('Validate endpoint called');
  res.json({ valid: true });
});
router.post('/refresh', authController.refreshToken);

// Rotas de 2FA
router.post('/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/2fa/confirm', authMiddleware, authController.confirm2FA);
router.delete('/2fa/disable', authMiddleware, authController.disable2FA);
router.get('/2fa/status', authMiddleware, authController.get2FAStatus);

console.log('Auth routes loaded');

export default router;