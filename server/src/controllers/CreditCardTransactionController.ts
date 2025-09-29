import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import { toDatabaseBoolean } from '../utils/booleanUtils';

// Função para calcular a data de vencimento com base na data da transação e dados do cartão
const calculateDueDate = (transactionDate: string, card: any): string | null => {
  try {
    // Verificar se o cartão tem os dados necessários
    if (!card || !card.closing_day || !card.due_day) {
      return null;
    }
    
    const [year, month, day] = transactionDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Se a data da transação for após o fechamento do cartão,
    // ou se o dia de vencimento for maior que o dia de fechamento,
    // o vencimento é para o mês seguinte
    if (date.getDate() > card.closing_day || card.due_day > card.closing_day) {
      date.setMonth(date.getMonth() + 1);
    }
    
    // Ajustar para o dia de vencimento
    date.setDate(card.due_day);
    
    // Formatar a data como string YYYY-MM-DD
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating due date:', error);
    return null;
  }
};

// Função helper para criar Date segura para timezone
const createSafeDate = (dateString: string): Date => {
  // Se a string já tem T, usar diretamente
  if (dateString.includes('T')) {
    // Extrair apenas a parte da data YYYY-MM-DD
    const [datePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  // Se é só a data (YYYY-MM-DD), criar data local
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const list = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - LIST =====');
  
  try {
    const { db, all } = getDatabase();
    
    // Construir query base
    let query = `
      SELECT 
        cct.*,
        c.name as category_name,
        sc.name as subcategory_name
      FROM credit_card_transactions cct
      LEFT JOIN categories c ON cct.category_id = c.id
      LEFT JOIN subcategories sc ON cct.subcategory_id = sc.id
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    // Filtros
    if (req.query.card_id) {
      conditions.push('cct.card_id = ?');
      values.push(req.query.card_id);
    }
    
    if (req.query.category_id) {
      conditions.push('cct.category_id = ?');
      values.push(req.query.category_id);
    }
    
    if (req.query.subcategory_id) {
      conditions.push('cct.subcategory_id = ?');
      values.push(req.query.subcategory_id);
    }
    
    if (req.query.is_installment !== undefined) {
      conditions.push('cct.is_installment = ?');
      values.push(req.query.is_installment === 'true' ? 1 : 0);
    }
    
    // Filtro de data baseado na data de vencimento (due_date) em vez da data da transação
    if (req.query.start_date) {
      conditions.push('cct.due_date >= ?');
      values.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      conditions.push('cct.due_date <= ?');
      values.push(req.query.end_date);
    }
    
    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Ordenação baseada na data de vencimento
    query += ' ORDER BY cct.due_date DESC, cct.created_at DESC';
    
    const transactions = await all(db, query, values);
    
    // Converter booleanos do banco de dados para valores JavaScript
    const convertedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      is_installment: transaction.is_installment === 1 || transaction.is_installment === true,
      is_paid: transaction.is_paid === 1 || transaction.is_paid === true
    }));
    
    res.json(convertedTransactions);
  } catch (error) {
    console.error('Error listing credit card transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getById = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - GET BY ID =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, get } = getDatabase();
    const transactionId = req.params.id;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    const query = `
      SELECT 
        cct.*,
        c.name as category_name,
        sc.name as subcategory_name
      FROM credit_card_transactions cct
      LEFT JOIN categories c ON cct.category_id = c.id
      LEFT JOIN subcategories sc ON cct.subcategory_id = sc.id
      WHERE cct.id = ?
    `;
    
    const transaction = await get(db, query, [transactionId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Converter booleanos do banco de dados para valores JavaScript
    const convertedTransaction = {
      ...transaction,
      is_installment: transaction.is_installment === 1 || transaction.is_installment === true,
      is_paid: transaction.is_paid === 1 || transaction.is_paid === true
    };
    
    res.json(convertedTransaction);
  } catch (error) {
    console.error('Error getting credit card transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const create = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - CREATE =====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { db, run, get } = getDatabase();
    
    const {
      description,
      amount,
      type,
      category_id,
      subcategory_id,
      card_id,
      transaction_date,
      is_installment,
      installment_number,
      total_installments,
      is_paid,
      payment_date,
      paid_amount,
      payment_type,
      payment_observations,
      discount,
      interest
    } = req.body;

    // Validate required fields
    if (!description || !amount || !type || !transaction_date || !card_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: description, amount, type, transaction_date, card_id' 
      });
    }

    // Obter informações do cartão para calcular a data de vencimento
    const cardQuery = 'SELECT * FROM cards WHERE id = ?';
    const card = await get(db, cardQuery, [card_id]);
    
    // Calcular a data de vencimento
    const due_date = card ? calculateDueDate(transaction_date, card) : null;
    
    console.log('Calculated due date:', due_date);

    const isProduction = process.env.NODE_ENV === 'production';
    const isPaidValue = toDatabaseBoolean(is_paid, isProduction);
    
    console.log('Inserindo transação no banco de dados...');
    console.log('Ambiente de produção:', isProduction);
    
    const result: any = await run(db, `
      INSERT INTO credit_card_transactions (
        description, amount, type, category_id, subcategory_id,
        card_id, transaction_date, due_date, is_installment, installment_number, total_installments,
        is_paid, payment_date, paid_amount, payment_type, payment_observations,
        discount, interest
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      description, amount, type, category_id, subcategory_id,
      card_id, transaction_date, due_date, toDatabaseBoolean(is_installment, isProduction), 
      installment_number, total_installments,
      isPaidValue, payment_date, paid_amount, payment_type, payment_observations,
      discount, interest
    ]);

    console.log('Transação inserida com sucesso, ID:', result.lastID);
    
    return res.status(201).json({ 
      id: result.lastID, 
      message: 'Credit card transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating credit card transaction:', error);
    res.status(500).json({ error: 'Failed to create credit card transaction: ' + error });
  }
};

const update = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - UPDATE =====');
  console.log('Request body:', req.body);
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run, get } = getDatabase();
    const transactionId = req.params.id;
    
    const {
      description,
      amount,
      type,
      category_id,
      subcategory_id,
      card_id,
      transaction_date,
      is_installment,
      installment_number,
      total_installments,
      is_paid,
      payment_date,
      paid_amount,
      payment_type,
      payment_observations,
      discount,
      interest
    } = req.body;

    // Validate required fields
    if (!description || amount === undefined || !type || !transaction_date || !card_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: description, amount, type, transaction_date, card_id' 
      });
    }

    // Verificar se é uma transação parcelada
    const existingTransaction = await get(db, 'SELECT * FROM credit_card_transactions WHERE id = ?', [transactionId]);
    
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Obter informações do cartão para calcular a data de vencimento
    const cardQuery = 'SELECT * FROM cards WHERE id = ?';
    const card = await get(db, cardQuery, [card_id]);
    
    // Calcular a data de vencimento
    const due_date = card ? calculateDueDate(transaction_date, card) : null;
    
    console.log('Calculated due date:', due_date);

    const isProduction = process.env.NODE_ENV === 'production';
    const isPaidValue = toDatabaseBoolean(is_paid, isProduction);
    
    if (existingTransaction.is_installment && existingTransaction.total_installments > 1) {
      // Atualizar todas as parcelas da transação
      console.log('Atualizando transação parcelada - todas as parcelas');
      
      // Atualizar todas as parcelas com os mesmos dados
      const result: any = await run(db, `
        UPDATE credit_card_transactions SET
          description = ?,
          amount = ?,
          type = ?,
          category_id = ?,
          subcategory_id = ?,
          card_id = ?,
          transaction_date = ?,
          due_date = ?,  -- Atualizar também a data de vencimento
          is_installment = ?,
          total_installments = ?,
          is_paid = ?,
          payment_date = ?,
          paid_amount = ?,
          payment_type = ?,
          payment_observations = ?,
          discount = ?,
          interest = ?
        WHERE description LIKE ?
      `, [
        description,
        amount,
        type,
        category_id,
        subcategory_id,
        card_id,
        transaction_date,
        due_date,  // Incluir a data de vencimento calculada
        toDatabaseBoolean(is_installment, isProduction),
        total_installments,
        isPaidValue,
        payment_date,
        paid_amount,
        payment_type,
        payment_observations,
        discount,
        interest,
        `${existingTransaction.description.split(' (')[0]}%`
      ]);

      res.json({ 
        id: transactionId, 
        message: 'Credit card transaction installments updated successfully'
      });
    } else {
      // Atualizar transação única
      console.log('Atualizando transação única');
      
      const result: any = await run(db, `
        UPDATE credit_card_transactions SET
          description = ?,
          amount = ?,
          type = ?,
          category_id = ?,
          subcategory_id = ?,
          card_id = ?,
          transaction_date = ?,
          due_date = ?,  -- Atualizar também a data de vencimento
          is_installment = ?,
          installment_number = ?,
          total_installments = ?,
          is_paid = ?,
          payment_date = ?,
          paid_amount = ?,
          payment_type = ?,
          payment_observations = ?,
          discount = ?,
          interest = ?
        WHERE id = ?
      `, [
        description,
        amount,
        type,
        category_id,
        subcategory_id,
        card_id,
        transaction_date,
        due_date,  // Incluir a data de vencimento calculada
        toDatabaseBoolean(is_installment, isProduction), 
        installment_number,
        total_installments,
        isPaidValue,
        payment_date,
        paid_amount,
        payment_type,
        payment_observations,
        discount,
        interest,
        transactionId
      ]);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ 
        id: transactionId, 
        message: 'Credit card transaction updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating credit card transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const remove = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - REMOVE =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const result: any = await run(db, 'DELETE FROM credit_card_transactions WHERE id = ?', [transactionId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Credit card transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit card transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createInstallments = async (req: Request, res: Response) => {
  console.log('===== CREDIT CARD TRANSACTION CONTROLLER - CREATE INSTALLMENTS =====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { db, run, get } = getDatabase();
    const {
      description,
      total_amount,
      total_installments,
      card_id,
      category_id,
      subcategory_id,
      transaction_date
    } = req.body;

    // Validações
    if (!description || !total_amount || !total_installments || !card_id || !transaction_date) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: description, total_amount, total_installments, card_id, transaction_date' 
      });
    }

    if (total_installments < 1 || total_installments > 99) {
      return res.status(400).json({ 
        error: 'Número de parcelas deve ser entre 1 e 99' 
      });
    }

    // Obter informações do cartão para verificar a data de fechamento
    const cardQuery = 'SELECT * FROM cards WHERE id = ?';
    const card = await get(db, cardQuery, [card_id]);
    
    // Manter a data da transação original - não ajustar a data da transação
    // Apenas usar a data original para determinar em qual fatura a transação aparece
    let adjustedTransactionDate = createSafeDate(transaction_date);
          
    // Se a data da transação for maior ou igual ao dia de fechamento do cartão,
    // ajustar para o próximo mês (próxima fatura)
    if (card && card.closing_day) {
      const transactionDay = adjustedTransactionDate.getDate();
            
      // Se a data da transação for maior ou igual à data de fechamento,
      // ajustar a transação para o próximo mês (aparecer na próxima fatura)
      if (transactionDay >= card.closing_day) {
        adjustedTransactionDate.setMonth(adjustedTransactionDate.getMonth() + 1);
      }
    }
    
    // Calcular valor de cada parcela
    const installmentAmount = parseFloat((total_amount / total_installments).toFixed(2));
    
    // Calcular diferença para ajustar na última parcela
    const totalCalculated = installmentAmount * (total_installments - 1);
    const lastInstallmentAmount = parseFloat((total_amount - totalCalculated).toFixed(2));

    const createdTransactions = [];
    
    // Criar todas as parcelas
    for (let i = 1; i <= total_installments; i++) {
      // Calcular data da parcela (adicionar meses)
      const installmentDate = createSafeDate(transaction_date);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
      
      const installmentDateString = installmentDate.toISOString().split('T')[0];
      
      // Calcular a data de vencimento para esta parcela
      const due_date = card ? calculateDueDate(installmentDateString, card) : null;
      
      // Valor da parcela (última parcela pode ter valor ajustado)
      const amount = i === total_installments ? lastInstallmentAmount : installmentAmount;
      
      const insertQuery = `
        INSERT INTO credit_card_transactions (
          description, 
          amount, 
          type, 
          category_id, 
          subcategory_id, 
          card_id, 
          transaction_date, 
          due_date,  -- Adicionar a data de vencimento calculada
          is_installment,
          installment_number,
          total_installments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const installmentDescription = `${description} (${i}/${total_installments})`;
      
      const result = await run(db, insertQuery, [
        installmentDescription,
        amount,
        'expense',
        category_id || null,
        subcategory_id || null,
        card_id,
        installmentDateString, // Manter a data original da transação
        due_date,  // Incluir a data de vencimento calculada
        toDatabaseBoolean(true),
        i,
        total_installments
      ]);
      
      // Buscar a transação criada
      const createdTransaction = await get(db, 'SELECT * FROM credit_card_transactions WHERE id = ?', [result.lastID]);
      createdTransactions.push(createdTransaction);
    }

    console.log(`✅ ${total_installments} parcelas criadas com sucesso`);
    
    res.json({
      message: `${total_installments} parcelas criadas com sucesso`,
      transactions: createdTransactions,
      total_amount,
      installment_amount: installmentAmount,
      last_installment_amount: lastInstallmentAmount
    });
    
  } catch (error) {
    console.error('Error creating credit card installments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  list,
  getById,
  create,
  update,
  delete: remove,
  createInstallments
};