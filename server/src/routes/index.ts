import { Router } from 'express';
import categoriesRouter from './categories';
import categoryTypesRouter from './categoryTypes';
import subcategoriesRouter from './subcategories';
import paymentStatusesRouter from './paymentStatuses';
import contactsRouter from './contacts';
import cardsRouter from './cards';
import bankAccountsRouter from './bankAccounts';
import costCentersRouter from './costCenters';
import transactionsRouter from './transactions';
import cashFlowRouter from './cashFlow';
import authRouter from './auth';
import usersRouter from './users';
import savingsGoalsRouter from './savingsGoals';

console.log('Loading routes...');

const router = Router();

router.use('/auth', authRouter);
console.log('Auth route loaded');

router.use('/categories', categoriesRouter);
router.use('/category-types', categoryTypesRouter);
router.use('/subcategories', subcategoriesRouter);
router.use('/payment-statuses', paymentStatusesRouter);
router.use('/contacts', contactsRouter);
router.use('/cards', cardsRouter);
router.use('/bank-accounts', bankAccountsRouter);
router.use('/cost-centers', costCentersRouter);
router.use('/transactions', transactionsRouter);
router.use('/cash-flow', cashFlowRouter);
router.use('/users', usersRouter);
router.use('/savings-goals', savingsGoalsRouter);

console.log('All routes loaded');

export default router;