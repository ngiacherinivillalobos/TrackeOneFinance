import { Router } from 'express';
import categoriesController from '../controllers/CategoriesController';

const router = Router();

router.get('/', (req, res) => {
  console.log('GET /api/categories route hit');
  return categoriesController.list(req, res);
});

router.get('/:id', (req, res) => {
  console.log('GET /api/categories/:id route hit');
  return categoriesController.show(req, res);
});

router.post('/', (req, res) => {
  console.log('POST /api/categories route hit');
  return categoriesController.create(req, res);
});

router.put('/:id', (req, res) => {
  console.log('PUT /api/categories/:id route hit');
  return categoriesController.update(req, res);
});

router.delete('/:id', (req, res) => {
  console.log('DELETE /api/categories/:id route hit');
  return categoriesController.delete(req, res);
});

export default router;
