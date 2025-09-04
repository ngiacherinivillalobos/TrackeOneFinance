import { Router } from 'express';
import paymentStatusesController from '../controllers/paymentStatusesController';
import { authMiddleware } from '../controllers/authMiddleware';

const router = Router();

// Endpoint temporário para verificar status de pagamento sem autenticação (apenas para debugging)
router.get('/debug', async (req, res) => {
  const { getDatabase } = await import('../database/connection');
  const { db, all } = getDatabase();
  try {
    const statuses = await all(db, 'SELECT * FROM payment_status ORDER BY id');
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching payment statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authMiddleware, paymentStatusesController.list);
router.post('/', authMiddleware, paymentStatusesController.create);
router.put('/:id', authMiddleware, paymentStatusesController.update);
router.delete('/:id', authMiddleware, paymentStatusesController.delete);

export default router;