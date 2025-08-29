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

console.log('Auth routes loaded');

export default router;