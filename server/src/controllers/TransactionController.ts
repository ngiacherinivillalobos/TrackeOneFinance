import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import { toDatabaseBoolean } from '../utils/booleanUtils';

// Função helper para criar Date segura para timezone
// Esta função garante consistência entre SQLite e PostgreSQL
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

// Função helper para obter data local no formato YYYY-MM-DD
// Esta função garante consistência entre SQLite e PostgreSQL
const getLocalDateString = (): string => {
  // Usar sempre a data local para consistência entre ambientes
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFilteredTransactions = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET FILTERED TRANSACTIONS =====');
  const {
    dateFilterType,
    month,
    year,
    customStartDate,
    customEndDate,
    transaction_type,
    payment_status,
    category_id,
    subcategory_id,
    contact_id,
    cost_center_id,
    orderBy,
    order,
  } = req.query;

  try {
    const { db, all } = getDatabase();
    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        sc.name as subcategory_name,
        co.name as contact_name,
        cc.name as cost_center_name,
        cc.number as cost_center_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
    `;
    const conditions: string[] = [];
    const values: any[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Date filters
    if (dateFilterType === 'month' && month && year) {
      // month já vem como índice correto (0-11), então usar diretamente
      const monthIndex = parseInt(month as string);
      const yearNum = parseInt(year as string);
      
      // Construir primeiro dia do mês
      const startDate = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      
      // Construir último dia do mês
      const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
      const endDate = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      console.log('Month filter applied:', { month, year, monthIndex, startDate, endDate });
      conditions.push('t.transaction_date BETWEEN ? AND ?');
      values.push(startDate, endDate);
    } else if (dateFilterType === 'year' && year) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      values.push(year as string);
    } else if (dateFilterType === 'custom' && customStartDate && customEndDate) {
      conditions.push('t.transaction_date BETWEEN ? AND ?');
      values.push(customStartDate, customEndDate);
    }

    // Other filters
    if (transaction_type) {
      const types = (transaction_type as string).split(',');
      conditions.push(`t.type IN (${types.map(() => '?').join(',')})`);
      values.push(...types);
    }
    
    // Corrigir o tratamento de payment_status para funcionar corretamente em ambos os ambientes
    if (payment_status) {
      const statuses = (payment_status as string).split(',');
      const statusConditions: string[] = [];
      const today = getLocalDateString();

      statuses.forEach(status => {
        if (status === 'paid') {
          // Em produção, verificar payment_status_id = 2
          // Em desenvolvimento, verificar is_paid = 1
          if (isProduction) {
            statusConditions.push('t.payment_status_id = 2');
          } else {
            statusConditions.push('t.is_paid = 1');
          }
        }
        if (status === 'unpaid') {
          // Em produção, verificar payment_status_id != 2 e data >= hoje
          // Em desenvolvimento, verificar is_paid != 1 e data >= hoje
          if (isProduction) {
            statusConditions.push('(t.payment_status_id != 2 AND t.transaction_date >= ?)');
          } else {
            statusConditions.push('(t.is_paid != 1 AND t.transaction_date >= ?)');
          }
        }
        if (status === 'overdue') {
          // Em produção, verificar payment_status_id = 3 (Vencido)
          // Em desenvolvimento, verificar is_paid = 0 e data < hoje
          if (isProduction) {
            statusConditions.push('(t.payment_status_id = 3 AND t.transaction_date < ?)');
          } else {
            statusConditions.push('(t.is_paid = 0 AND t.transaction_date < ?)');
          }
        }
        if (status === 'cancelled') {
          // Em produção, verificar payment_status_id = 3 (Vencido)
          // Em desenvolvimento, verificar is_paid = 0 (assumindo que cancelado = não pago)
          if (isProduction) {
            statusConditions.push('t.payment_status_id = 3');
          } else {
            statusConditions.push('t.is_paid = 0');
          }
        }
      });
      
      if (statusConditions.length > 0) {
        conditions.push(`(${statusConditions.join(' OR ')})`);
        // Adicionar a data de hoje para os filtros que precisam
        if ((payment_status as string).includes('unpaid') || (payment_status as string).includes('overdue')) {
          values.push(today);
        }
      }
    }
    
    if (category_id) {
      const ids = (category_id as string).split(',');
      conditions.push(`t.category_id IN (${ids.map(() => '?').join(',')})`);
      values.push(...ids);
    }
    if (subcategory_id) {
      conditions.push('t.subcategory_id = ?');
      values.push(subcategory_id);
    }
    if (contact_id) {
      const ids = (contact_id as string).split(',');
      conditions.push(`t.contact_id IN (${ids.map(() => '?').join(',')})`);
      values.push(...ids);
    }
    if (cost_center_id) {
      const ids = (cost_center_id as string).split(',');
      conditions.push(`t.cost_center_id IN (${ids.map(() => '?').join(',')})`);
      values.push(...ids);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const validOrderBy = ['transaction_date', 'description', 'amount', 'status'];
    const sortColumn = validOrderBy.includes(orderBy as string) ? orderBy : 'transaction_date';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    
    const currentDateFunction = isProduction ? 'CURRENT_DATE' : "date('now')";
    
    if (sortColumn === 'status') {
      query += ` ORDER BY CASE 
        WHEN ${isProduction ? 't.payment_status_id = 3' : 't.is_paid = 0'} AND t.transaction_date < ${currentDateFunction} THEN 1 -- Vencido
        WHEN ${isProduction ? 't.payment_status_id != 2' : 't.is_paid != 1'} AND t.transaction_date = ${currentDateFunction} THEN 2 -- Vence Hoje
        WHEN ${isProduction ? 't.payment_status_id != 2' : 't.is_paid != 1'} AND t.transaction_date > ${currentDateFunction} THEN 3 -- Em Aberto
        WHEN ${isProduction ? 't.payment_status_id = 2' : 't.is_paid = 1'} THEN 4 -- Pago
        ELSE 5
      END ${sortOrder}, t.transaction_date DESC`;
    } else {
      query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    }

    const transactions = await all(db, query, values);
    
    const convertedTransactions = transactions.map((transaction: any) => {
      // Converter tipo do banco para o formato do frontend
      let frontendType = transaction.type; // fallback
      if (transaction.type === 'expense') frontendType = 'Despesa';
      if (transaction.type === 'income') frontendType = 'Receita';
      if (transaction.type === 'investment') frontendType = 'Investimento';
      
      console.log(`[getFilteredTransactions] Converting type: ${transaction.type} -> ${frontendType} for transaction ${transaction.id}`);
      
      // Garantir que is_paid está sincronizado com payment_status_id
      let isPaid = false;
      if (isProduction) {
        isPaid = transaction.payment_status_id === 2;
      } else {
        isPaid = transaction.is_paid === 1 || transaction.is_paid === true;
      }
      
      return {
        ...transaction,
        transaction_type: frontendType,
        is_recurring: transaction.is_recurring === 1 || transaction.is_recurring === true,
        is_installment: transaction.is_installment === 1 || transaction.is_installment === true,
        is_paid: isPaid,
        payment_status_id: isProduction ? transaction.payment_status_id : (isPaid ? 2 : 1) // Sincronizar payment_status_id para frontend
      };
    });

    console.log(`[getFilteredTransactions] Final converted transactions count: ${convertedTransactions.length}`);
    console.log(`[getFilteredTransactions] Sample transaction types:`, convertedTransactions.slice(0, 3).map(t => ({ id: t.id, type: t.type, transaction_type: t.transaction_type })));

    res.json(convertedTransactions);
  } catch (error) {
    console.error('Error fetching filtered transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Função helper para criar uma transação individual
const createSingleTransaction = async (db: any, params: {
  description: string;
  amount: number;
  dbType: string;
  category_id: number;
  subcategory_id: number;
  currentPaymentStatusId: number;
  bank_account_id: number;
  card_id: number;
  contact_id: number;
  formattedDate: string;
  cost_center_id: number;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  is_recurring?: boolean;
  recurrence_type?: string;
}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const query = `
    INSERT INTO transactions (
      description, amount, type, category_id, subcategory_id,
      payment_status_id, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, is_installment, installment_number, total_installments, is_recurring, recurrence_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { db: database, run } = getDatabase();
  
  // Garantir consistência entre payment_status_id e is_paid
  let paymentStatusId = params.currentPaymentStatusId;
  let isPaidValue: number | boolean = paymentStatusId === 2;
  
  // Ajustar valores de acordo com o ambiente
  if (isProduction) {
    // PostgreSQL usa booleanos
    isPaidValue = paymentStatusId === 2;
  } else {
    // SQLite usa 0/1
    isPaidValue = paymentStatusId === 2 ? 1 : 0;
  }
  
  return run(database, query, [
    params.description, params.amount, params.dbType, params.category_id, params.subcategory_id,
    paymentStatusId, params.bank_account_id, params.card_id, params.contact_id, 
    params.formattedDate, params.cost_center_id, toDatabaseBoolean(params.is_installment, isProduction), 
    params.installment_number || null, params.total_installments || null,
    toDatabaseBoolean(params.is_recurring, isProduction), params.recurrence_type || null
  ]);
};

const list = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - LIST =====');
  console.log('Query params:', req.query);
  
  try {
    const { db, all } = getDatabase();
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Construir query base
    let query = `
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.type as transaction_type,
        t.category_id,
        t.subcategory_id,
        t.payment_status_id,
        t.contact_id,
        t.cost_center_id,
        t.transaction_date,
        t.created_at,
        t.is_recurring,
        t.recurrence_type,
        t.recurrence_count,
        t.recurrence_end_date,
        t.is_installment,
        t.installment_number,
        t.total_installments,
        ${isProduction ? 't.is_paid as is_paid,' : ''}
        c.name as category_name,
        sc.name as subcategory_name,
        co.name as contact_name,
        cc.name as cost_center_name,
        cc.number as cost_center_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    // Filtros
    if (req.query.category_id) {
      conditions.push('t.category_id = ?');
      values.push(req.query.category_id);
    }
    
    if (req.query.subcategory_id) {
      conditions.push('t.subcategory_id = ?');
      values.push(req.query.subcategory_id);
    }
    
    if (req.query.contact_id) {
      conditions.push('t.contact_id = ?');
      values.push(req.query.contact_id);
    }
    
    if (req.query.cost_center_id) {
      conditions.push('t.cost_center_id = ?');
      values.push(req.query.cost_center_id);
    }
    
    if (req.query.transaction_type || req.query.type) {
      conditions.push('t.type = ?');
      values.push(req.query.transaction_type || req.query.type);
    }
    
    if (req.query.start_date) {
      conditions.push('t.transaction_date >= ?');
      values.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      conditions.push('t.transaction_date <= ?');
      values.push(req.query.end_date);
    }
    
    // Corrigir o tratamento de payment_status_id para funcionar corretamente em ambos os ambientes
    if (req.query.payment_status_id) {
      const statusId = parseInt(req.query.payment_status_id as string);
      if (isProduction) {
        conditions.push('t.payment_status_id = ?');
        values.push(statusId);
      } else {
        // Converter payment_status_id para is_paid no SQLite
        if (statusId === 2) {
          // Pago
          conditions.push('t.is_paid = ?');
          values.push(1);
        } else if (statusId === 1) {
          // Em aberto
          conditions.push('t.is_paid = ?');
          values.push(0);
        } else if (statusId === 3) {
          // Vencido - tratar como não pago
          conditions.push('t.is_paid = ?');
          values.push(0);
        }
      }
    }
    
    if (req.query.is_paid !== undefined) {
      const isPaidValue = req.query.is_paid === 'true' || req.query.is_paid === '1';
      if (isProduction) {
        conditions.push('t.payment_status_id = ?');
        values.push(isPaidValue ? 2 : 1); // 2 = Pago, 1 = Em aberto
      } else {
        conditions.push('t.is_paid = ?');
        values.push(isPaidValue ? 1 : 0); // 1 = Pago, 0 = Em aberto
      }
    }
    
    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Ordenação
    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    
    console.log('Final query:', query);
    console.log('Values:', values);
    
    const transactions = await all(db, query, values);
    
    // Converter booleanos do banco de dados para valores JavaScript
    // Converter tipos do banco (inglês) para frontend (português)
    const convertedTransactions = transactions.map((transaction: any) => {
      let frontendType = transaction.transaction_type;
      if (transaction.transaction_type === 'expense') frontendType = 'Despesa';
      if (transaction.transaction_type === 'income') frontendType = 'Receita';
      if (transaction.transaction_type === 'investment') frontendType = 'Investimento';
      
      console.log(`[list] Converting type: ${transaction.transaction_type} -> ${frontendType} for transaction ${transaction.id}`);
      
      // Garantir consistência do campo is_paid entre ambientes
      let isPaid = false;
      if (isProduction) {
        isPaid = transaction.payment_status_id === 2;
      } else {
        isPaid = transaction.is_paid === 1 || transaction.is_paid === true;
      }
      
      return {
        ...transaction,
        transaction_type: frontendType,
        is_recurring: transaction.is_recurring === 1 || transaction.is_recurring === true,
        is_installment: transaction.is_installment === 1 || transaction.is_installment === true,
        is_paid: isPaid
      };
    });
    
    console.log(`[list] Final converted transactions count: ${convertedTransactions.length}`);
    console.log(`[list] Sample transaction types:`, convertedTransactions.slice(0, 3).map(t => ({ id: t.id, transaction_type: t.transaction_type })));

    res.json(convertedTransactions);
  } catch (error) {
    console.error('Error listing transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getById = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET BY ID =====');
  console.log('Transaction ID:', req.params.id);
  console.log('User from auth:', (req as any).user);
  
  try {
    const { db, get } = getDatabase();
    const transactionId = req.params.id;
    
    if (!transactionId) {
      console.log('ERROR: Transaction ID is missing');
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    console.log('Executing query for transaction ID:', transactionId);
    
    const query = `
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.type as transaction_type,
        t.category_id,
        t.subcategory_id,
        t.payment_status_id,
        t.contact_id,
        t.cost_center_id,
        t.transaction_date,
        t.created_at,
        t.is_recurring,
        t.recurrence_type,
        t.recurrence_count,
        t.recurrence_end_date,
        t.is_installment,
        t.installment_number,
        t.total_installments,
        c.name as category_name,
        sc.name as subcategory_name,
        co.name as contact_name,
        cc.name as cost_center_name,
        cc.number as cost_center_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      WHERE t.id = ?
    `;
    
    const transaction = await get(db, query, [transactionId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Converter booleanos do banco de dados para valores JavaScript
    // Converter tipos do banco (inglês) para frontend (português)
    let frontendType = transaction.transaction_type;
    if (transaction.transaction_type === 'expense') frontendType = 'Despesa';
    if (transaction.transaction_type === 'income') frontendType = 'Receita';
    if (transaction.transaction_type === 'investment') frontendType = 'Investimento';
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Garantir que is_paid está sincronizado com payment_status_id
    let isPaid = false;
    if (isProduction) {
      isPaid = transaction.payment_status_id === 2;
    } else {
      isPaid = transaction.is_paid === 1 || transaction.is_paid === true;
    }
    
    const convertedTransaction = {
      ...transaction,
      transaction_type: frontendType,
      is_recurring: transaction.is_recurring === 1 || transaction.is_recurring === true,
      is_installment: transaction.is_installment === 1 || transaction.is_installment === true,
      is_paid: isPaid
    };
    
    res.json(convertedTransaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const create = async (req: Request, res: Response) => {
  console.log('🔥🔥🔥 TRANSACTION CREATE CALLED 🔥🔥🔥');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { db, run } = getDatabase();
    
    const {
      description,
      amount,
      type,
      transaction_type,
      category_id,
      subcategory_id,
      payment_status_id,
      bank_account_id,
      card_id,
      contact_id,
      transaction_date,
      cost_center_id,
      is_recurring,
      recurrence_type,
      recurrence_count,
      recurrence_end_date,
      recurrence_weekday,
      is_installment,
      total_installments,
      is_paid
    } = req.body;

    // Use transaction_type se estiver presente, senão usa type
    const finalType = transaction_type || type;
    
    console.log('CREATE - Transaction type conversion:', {
      transaction_type,
      type,
      finalType
    });

    // Convert Portuguese to English for database compatibility
    let dbType = finalType;
    if (finalType === 'Despesa') dbType = 'expense';
    if (finalType === 'Receita') dbType = 'income';
    if (finalType === 'Investimento') dbType = 'investment';
    
    console.log('CREATE - Database type after conversion:', dbType);

    // Validate required fields
    if (!description || !amount || !finalType || !transaction_date) {
      return res.status(400).json({ error: 'Missing required fields: description, amount, type, transaction_date' });
    }

    // Validate mandatory fields: category, contact, and cost center
    if (!category_id && category_id !== 0) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }
    if (!contact_id && contact_id !== 0) {
      return res.status(400).json({ error: 'Contato é obrigatório' });
    }
    if (!cost_center_id && cost_center_id !== 0) {
      return res.status(400).json({ error: 'Centro de Custo é obrigatório' });
    }

    // Lógica para determinar o payment_status_id
    let finalPaymentStatusId = payment_status_id;
    
    // Se is_paid é true, sempre definir como Pago (status 2)
    if (is_paid === true) {
      finalPaymentStatusId = 2; // Pago
    }
    // Se payment_status_id é 2, mantém como Pago
    else if (payment_status_id === 2) {
      finalPaymentStatusId = 2; // Mantém como Pago
    }
    // Se payment_status_id não está definido (vazio ou null/undefined)
    else if (!payment_status_id || payment_status_id === '') {
      const today = getLocalDateString();
      
      if (transaction_date < today) {
        finalPaymentStatusId = 3; // Vencido (corrigido)
      } else {
        finalPaymentStatusId = 1; // Em aberto
      }
    }
    // Caso contrário, usar o payment_status_id fornecido
    else {
      finalPaymentStatusId = payment_status_id;
    }

    console.log('Creating transaction with payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: getLocalDateString(),
      final_payment_status_id: finalPaymentStatusId
    });

    // Lógica de transações parceladas (não recorrentes)
    if (is_installment && total_installments && total_installments > 1) {
      console.log('Creating installment transactions');
      let createdTransactions: any[] = [];
      let errors: any[] = [];
      
      // Garantir que total_installments é um número
      const totalInstallmentsNum = typeof total_installments === 'string' ? parseInt(total_installments) : total_installments;
      
      // Criar transações parceladas com datas diferentes para cada mês
      const baseDate = createSafeDate(transaction_date);
      
      for (let i = 1; i <= totalInstallmentsNum; i++) {
        console.log(`Creating installment ${i} of ${totalInstallmentsNum}`);
        
        // Calcular a data para esta parcela (adicionando meses)
        const installmentDate = createSafeDate(transaction_date);
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
        
        // Ajustar o dia se necessário (para meses com menos dias)
        if (installmentDate.getDate() !== baseDate.getDate()) {
          // Isso acontece quando o dia não existe no mês (ex: 31 de janeiro -> 31 de fevereiro)
          installmentDate.setDate(0); // Vai para o último dia do mês anterior
        }
        
        const formattedDate = installmentDate.toISOString().split('T')[0];
        
        // Remover qualquer número de parcela existente na descrição antes de adicionar o novo
        let cleanDescription = description;
        // Padrão mais abrangente para remover números de parcela
        const parcelPattern = /\s*\(\d+(\/\d+)?\)\s*$/g;
        cleanDescription = cleanDescription.replace(parcelPattern, '').trim();
        // Remover também padrões no meio da descrição
        cleanDescription = cleanDescription.replace(/\s*\(\d+\/\d+\)\s*/g, ' ').trim();
        // Remover espaços extras
        cleanDescription = cleanDescription.replace(/\s+/g, ' ').trim();
        
        // Salvar a descrição limpa no banco de dados (sem números)
        // A formatação será feita apenas no frontend para exibição
        try {
          const isProduction = process.env.NODE_ENV === 'production';
          const result: any = await run(db, `
            INSERT INTO transactions (
              description, amount, type, category_id, subcategory_id,
              payment_status_id, bank_account_id, card_id, contact_id, 
              transaction_date, cost_center_id, is_installment, installment_number, total_installments, is_recurring
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            cleanDescription, amount, dbType, category_id, subcategory_id,
            finalPaymentStatusId, bank_account_id, card_id, contact_id, 
            formattedDate, cost_center_id, toDatabaseBoolean(is_installment, isProduction), i, totalInstallmentsNum, toDatabaseBoolean(false, isProduction)
          ]);

          createdTransactions.push({
            id: result.lastID,
            transaction_date: formattedDate,
            installment_number: i,
            total_installments: totalInstallmentsNum
          });
        } catch (err) {
          console.error(`Error creating installment ${i}:`, err);
          errors.push({ installment: i, error: err });
          // Continuar criando as outras parcelas mesmo que uma falhe
        }
      }
      
      // Verificar se pelo menos algumas transações foram criadas
      if (createdTransactions.length > 0) {
        if (errors.length > 0) {
          // Se houve erros mas algumas transações foram criadas
          return res.status(201).json({ 
            message: `${createdTransactions.length} installment transactions created successfully, ${errors.length} failed`,
            transactions: createdTransactions,
            count: createdTransactions.length,
            errors: errors
          });
        } else {
          // Se todas as transações foram criadas com sucesso
          return res.status(201).json({ 
            message: `${createdTransactions.length} installment transactions created successfully`,
            transactions: createdTransactions,
            count: createdTransactions.length
          });
        }
      } else {
        // Se nenhuma transação foi criada, lançar um erro
        return res.status(500).json({ error: 'Failed to create installment transactions', errors: errors });
      }
    }

    // Lógica de recorrência (apenas se não for parcelado)
    if (is_recurring && !is_installment) {
      console.log('Creating recurring transactions');
      let createdTransactions: any[] = [];
      
      // Determinar a data de início e fim
      const startDate = createSafeDate(transaction_date);
      let endDate: Date;
      let maxRecurrences: number;
      
      // Se for recorrência personalizada com quantidade definida
      if (recurrence_type === 'personalizado' && recurrence_count) {
        maxRecurrences = parseInt(recurrence_count);
        if (recurrence_weekday) {
          // Para recorrência semanal
          endDate = createSafeDate(transaction_date);
          endDate.setDate(startDate.getDate() + (maxRecurrences * 7));
        } else {
          // Para recorrência mensal
          endDate = createSafeDate(transaction_date);
          endDate.setMonth(startDate.getMonth() + maxRecurrences);
        }
      } 
      // Se for recorrência fixa com data final definida
      else if (recurrence_type === 'fixo' && recurrence_end_date) {
        endDate = createSafeDate(recurrence_end_date);
        // Calcular o número de recorrências baseado na data final
        let tempDate = createSafeDate(transaction_date);
        maxRecurrences = 0;
        while (tempDate <= endDate) {
          maxRecurrences++;
          tempDate.setMonth(tempDate.getMonth() + 1);
        }
      } 
      // Se for recorrência mensal com quantidade definida
      else if (recurrence_type === 'mensal' && recurrence_count) {
        maxRecurrences = parseInt(recurrence_count);
        endDate = createSafeDate(transaction_date);
        endDate.setMonth(startDate.getMonth() + maxRecurrences);
      }
      // Default para 12 meses se não especificado
      else {
        maxRecurrences = 12;
        endDate = createSafeDate(transaction_date);
        endDate.setMonth(startDate.getMonth() + maxRecurrences);
      }

      console.log('Recurrence parameters:', { 
        startDate, 
        endDate, 
        maxRecurrences, 
        recurrence_type, 
        recurrence_count 
      });

      // Criar transações recorrentes
      let currentDate = createSafeDate(transaction_date);
      let installmentNumber = 1;

      // Continuar até atingir a data final ou o número máximo de recorrências
      while (installmentNumber <= maxRecurrences) {
        console.log(`Creating recurring transaction ${installmentNumber} of max ${maxRecurrences}`);
        console.log('Current date:', currentDate.toISOString().split('T')[0]);
        
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        try {
          // Remover qualquer número de parcela existente na descrição antes de adicionar o novo
          let cleanDescription = description;
          // Padrão mais abrangente para remover números de parcela
          const parcelPattern = /\s*\(\d+(\/\d+)?\)\s*$/g;
          cleanDescription = cleanDescription.replace(parcelPattern, '').trim();
          // Remover também padrões no meio da descrição
          cleanDescription = cleanDescription.replace(/\s*\(\d+\/\d+\)\s*/g, ' ').trim();
          // Remover espaços extras
          cleanDescription = cleanDescription.replace(/\s+/g, ' ').trim();
          
          // Salvar a descrição limpa no banco de dados (sem números)
          // A formatação será feita apenas no frontend para exibição
          const isProduction = process.env.NODE_ENV === 'production';
          const result: any = await run(db, `
            INSERT INTO transactions (
              description, amount, type, category_id, subcategory_id,
              payment_status_id, bank_account_id, card_id, contact_id, 
              transaction_date, cost_center_id, is_recurring, recurrence_type,
              is_installment, installment_number, total_installments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            cleanDescription, amount, dbType, category_id, subcategory_id,
            finalPaymentStatusId, bank_account_id, card_id, contact_id, 
            formattedDate, cost_center_id, toDatabaseBoolean(is_recurring, isProduction), recurrence_type,
            toDatabaseBoolean(false, isProduction), installmentNumber, maxRecurrences
          ]);

          createdTransactions.push({
            id: result.lastID,
            transaction_date: formattedDate,
            installment_number: installmentNumber,
            total_installments: maxRecurrences
          });

          // Avançar para a próxima data
          if (recurrence_type === 'mensal' || recurrence_type === 'fixo') {
            // Para recorrência mensal, usar a mesma lógica das transações parceladas
            const nextDate = new Date(currentDate.getTime());
            nextDate.setMonth(currentDate.getMonth() + 1);
            
            // Ajustar o dia se necessário (para meses com menos dias)
            if (nextDate.getDate() !== currentDate.getDate()) {
              // Isso acontece quando o dia não existe no mês (ex: 31 de janeiro -> 31 de fevereiro)
              nextDate.setDate(0); // Vai para o último dia do mês anterior
            }
            
            currentDate = nextDate;
          } else if (recurrence_type === 'personalizado') {
            // Para recorrência personalizada, adicionar os dias especificados
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (recurrence_type === 'semanal') {
            // Para recorrência semanal
            currentDate.setDate(currentDate.getDate() + 7);
          } else {
            // Default: avançar um mês
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          installmentNumber++;
        } catch (err) {
          console.error('Error creating recurring transaction:', err);
          if (createdTransactions.length === 0) {
            throw err; // Se falhar na primeira, retornar erro
          } else {
            // Se já criou algumas, retornar as que foram criadas
            break;
          }
        }
      }
      
      // Garantir que o retorno aconteça mesmo quando há erro parcial
      if (createdTransactions.length > 0) {
        return res.status(201).json({ 
          message: `${createdTransactions.length} recurring transactions created successfully`,
          transactions: createdTransactions,
          count: createdTransactions.length
        });
      } else {
        // Se nenhuma transação foi criada, lançar um erro
        return res.status(500).json({ error: 'Failed to create recurring transactions' });
      }
    }

    // Transação única (apenas se não for parcelado e não for recorrente)
    // Remover qualquer número de parcela existente na descrição antes de salvar
    let cleanDescription = description;
    // Padrão mais abrangente para remover números de parcela
    const parcelPattern = /\s*\(\d+(\/\d+)?\)\s*$/g;
    cleanDescription = cleanDescription.replace(parcelPattern, '').trim();
    // Remover também padrões no meio da descrição
    cleanDescription = cleanDescription.replace(/\s*\(\d+\/\d+\)\s*/g, ' ').trim();
    // Remover espaços extras
    cleanDescription = cleanDescription.replace(/\s+/g, ' ').trim();
    
    const isProduction = process.env.NODE_ENV === 'production';
    const result: any = await run(db, `
      INSERT INTO transactions (
        description, amount, type, category_id, subcategory_id,
        payment_status_id, bank_account_id, card_id, contact_id, 
        transaction_date, cost_center_id, is_installment, installment_number, total_installments,
        is_recurring
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cleanDescription, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, toDatabaseBoolean(is_installment, isProduction), 
      null, null,
      toDatabaseBoolean(is_recurring, isProduction)
    ]);

    console.log('Transaction created with type:', { dbType, finalType, transaction_type, type });

    return res.status(201).json({ 
      id: result.lastID, 
      message: 'Transaction created successfully',
      transaction: {
        id: result.lastID,
        description: cleanDescription,
        amount,
        type: dbType,
        category_id,
        subcategory_id,
        payment_status_id: finalPaymentStatusId,
        bank_account_id,
        card_id,
        contact_id,
        transaction_date: transaction_date instanceof Date ? transaction_date.toISOString().split('T')[0] : transaction_date,
        is_installment: toDatabaseBoolean(is_installment, isProduction),
        is_recurring: toDatabaseBoolean(is_recurring, isProduction)
      }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Failed to create transaction: ' + error });
  }
};

const update = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - UPDATE =====');
  console.log('Request body:', req.body);
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run } = getDatabase();
    const transactionId = req.params.id;
    
    const {
      description,
      amount,
      type,
      transaction_type,
      category_id,
      subcategory_id,
      payment_status_id,
      bank_account_id,
      card_id,
      contact_id,
      transaction_date,
      cost_center_id,
      is_recurring,
      recurrence_type,
      recurrence_count,
      recurrence_end_date,
      recurrence_weekday,
      is_installment,
      total_installments,
      is_paid
    } = req.body;

    // Use transaction_type se estiver presente, senão usa type
    const finalType = transaction_type || type;
    
    console.log('UPDATE - Transaction type conversion:', {
      transaction_type,
      type,
      finalType
    });

    // Convert Portuguese to English for database compatibility
    let dbType = finalType;
    if (finalType === 'Despesa') dbType = 'expense';
    if (finalType === 'Receita') dbType = 'income';
    if (finalType === 'Investimento') dbType = 'investment';
    
    console.log('UPDATE - Database type after conversion:', dbType);

    // Validate required fields
    if (!description || !amount || !finalType || !transaction_date) {
      console.log('UPDATE - Missing required fields:', { description, amount, finalType, transaction_date });
      return res.status(400).json({ error: 'Missing required fields: description, amount, type, transaction_date' });
    }

    // Validate mandatory fields: category, contact, and cost center
    if (!category_id && category_id !== 0) {
      console.log('UPDATE - Missing category_id');
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }
    if (!contact_id && contact_id !== 0) {
      console.log('UPDATE - Missing contact_id');
      return res.status(400).json({ error: 'Contato é obrigatório' });
    }
    if (!cost_center_id && cost_center_id !== 0) {
      console.log('UPDATE - Missing cost_center_id');
      return res.status(400).json({ error: 'Centro de Custo é obrigatório' });
    }

    // Lógica para determinar o payment_status_id
    let finalPaymentStatusId = payment_status_id;
    
    // Se is_paid é true, sempre definir como Pago (status 2)
    if (is_paid === true) {
      finalPaymentStatusId = 2; // Pago
    }
    // Se payment_status_id é 2, mantém como Pago
    else if (payment_status_id === 2) {
      finalPaymentStatusId = 2; // Mantém como Pago
    }
    // Se payment_status_id não está definido (vazio ou null/undefined)
    else if (!payment_status_id || payment_status_id === '') {
      const today = getLocalDateString();
      
      if (transaction_date < today) {
        finalPaymentStatusId = 3; // Vencido
      } else {
        finalPaymentStatusId = 1; // Em aberto
      }
    }
    // Caso contrário, usar o payment_status_id fornecido
    else {
      finalPaymentStatusId = payment_status_id;
    }

    console.log('Updating transaction with payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: getLocalDateString(),
      final_payment_status_id: finalPaymentStatusId
    });

    // Atualizar transação única com sincronização entre payment_status_id e is_paid
    const isProduction = process.env.NODE_ENV === 'production';
    const isPaidBoolean = toDatabaseBoolean(finalPaymentStatusId === 2, isProduction);
    
    const result: any = await run(db, `
      UPDATE transactions SET
        description = ?,
        amount = ?,
        type = ?,
        category_id = ?,
        subcategory_id = ?,
        payment_status_id = ?,
        bank_account_id = ?,
        card_id = ?,
        contact_id = ?,
        transaction_date = ?,
        cost_center_id = ?,
        is_recurring = ?,
        recurrence_type = ?,
        recurrence_count = ?,
        recurrence_end_date = ?,
        is_installment = ?,
        installment_number = ?,
        total_installments = ?,
        is_paid = ?
      WHERE id = ?
    `, [
      description, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, toDatabaseBoolean(is_recurring, isProduction),
      recurrence_type,
      recurrence_count,
      recurrence_end_date,
      toDatabaseBoolean(is_installment, isProduction),
      null, // installment_number
      total_installments,
      isPaidBoolean, // is_paid sincronizado
      transactionId
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ 
      id: transactionId, 
      message: 'Transaction updated successfully',
      transaction: {
        id: transactionId,
        description,
        amount,
        type: dbType,
        category_id,
        subcategory_id,
        payment_status_id: finalPaymentStatusId,
        bank_account_id,
        card_id,
        contact_id,
        transaction_date: transaction_date instanceof Date ? transaction_date.toISOString().split('T')[0] : transaction_date,
        is_recurring: toDatabaseBoolean(is_recurring, isProduction),
        recurrence_type,
        recurrence_count,
        recurrence_end_date,
        is_installment: toDatabaseBoolean(is_installment, isProduction),
        total_installments
      }
    });
  } catch (error) {
    console.error('===== UPDATE TRANSACTION ERROR =====');
    console.error('Error updating transaction:', error);
    console.error('Transaction ID:', req.params.id);
    console.error('Request body:', req.body);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    console.error('================================');
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

const remove = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - REMOVE =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const result: any = await run(db, 'DELETE FROM transactions WHERE id = ?', [transactionId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsPaid = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - MARK AS PAID =====');
  console.log('Transaction ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const { db, run, get } = getDatabase();
    const transactionId = req.params.id;
    const { 
      payment_date, 
      paid_amount, 
      payment_type, 
      bank_account_id, 
      card_id, 
      observations,
      discount,
      interest
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Verificar se a transação existe
    const transaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Atualizar o status de pagamento para "Pago" (ID = 2) e is_paid = true
    const isProduction = process.env.NODE_ENV === 'production';
    const isPaidValue = toDatabaseBoolean(true, isProduction);
    
    // Preparar os campos a serem atualizados
    const updateFields = ['payment_status_id = 2', 'is_paid = ?'];
    const updateValues = [isPaidValue];
    
    // Adicionar campos de pagamento se fornecidos
    if (payment_date) {
      updateFields.push('payment_date = ?');
      updateValues.push(payment_date);
    }
    
    if (paid_amount !== undefined) {
      updateFields.push('paid_amount = ?');
      updateValues.push(paid_amount);
    }
    
    if (payment_type) {
      updateFields.push('payment_type = ?');
      updateValues.push(payment_type);
    }
    
    if (bank_account_id !== undefined) {
      updateFields.push('bank_account_id = ?');
      updateValues.push(bank_account_id);
    }
    
    if (card_id !== undefined) {
      updateFields.push('card_id = ?');
      updateValues.push(card_id);
    }
    
    if (observations !== undefined) {
      updateFields.push('payment_observations = ?');
      updateValues.push(observations);
    }
    
    // Adicionar desconto ou juros se fornecidos
    if (discount !== undefined && discount > 0) {
      updateFields.push('discount = ?');
      updateValues.push(discount);
    }
    
    if (interest !== undefined && interest > 0) {
      updateFields.push('interest = ?');
      updateValues.push(interest);
    }
    
    // Adicionar o ID da transação aos valores
    updateValues.push(transactionId);
    
    const result: any = await run(db, `
      UPDATE transactions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Buscar a transação atualizada
    const updatedTransaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);

    res.json({ 
      id: transactionId, 
      message: 'Transaction marked as paid successfully',
      transaction: {
        ...updatedTransaction,
        payment_status_id: 2,
        is_paid: true
      }
    });
  } catch (error) {
    console.error('Error marking transaction as paid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const reversePayment = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - REVERSE PAYMENT =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run, get } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Verificar se a transação existe
    const transaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Atualizar o status de pagamento (voltar para "Em aberto") e is_paid = false
    const isProduction = process.env.NODE_ENV === 'production';
    const isPaidValue = toDatabaseBoolean(false, isProduction);
    const result: any = await run(db, `
      UPDATE transactions 
      SET payment_status_id = 1, is_paid = ?
      WHERE id = ?
    `, [isPaidValue, transactionId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ 
      id: transactionId, 
      message: 'Transaction payment reversed successfully',
      transaction: {
        ...transaction,
        payment_status_id: 1,
        is_paid: false
      }
    });
  } catch (error) {
    console.error('Error reversing transaction payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const batchEdit = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - BATCH EDIT =====');
  console.log('Request body:', req.body);
  
  try {
    const { db, run } = getDatabase();
    const { transactionIds, updates } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs are required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates are required' });
    }

    // Construir query de atualização
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updates);
    const placeholders = transactionIds.map(() => '?').join(', ');
    const values = [...updateValues, ...transactionIds];

    const query = `
      UPDATE transactions 
      SET ${setClause}
      WHERE id IN (${placeholders})
    `;

    console.log('Batch edit query:', query);
    console.log('Batch edit values:', values);

    const result: any = await run(db, query, values);

    res.json({ 
      message: `${result.changes} transactions updated successfully`,
      count: result.changes
    });
  } catch (error) {
    console.error('Error batch editing transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTransactionStats = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET STATS =====');
  console.log('Query params:', req.query);
  
  try {
    const { db, all } = getDatabase();
    
    // Construir query base para estatísticas
    let query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      WHERE 1=1
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    // Filtros
    if (req.query.start_date) {
      conditions.push('transaction_date >= ?');
      values.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      conditions.push('transaction_date <= ?');
      values.push(req.query.end_date);
    }
    
    if (req.query.cost_center_id) {
      conditions.push('cost_center_id = ?');
      values.push(req.query.cost_center_id);
    }
    
    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY type';
    
    console.log('Stats query:', query);
    console.log('Values:', values);
    
    const stats = await all(db, query, values);
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPaymentDetails = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET PAYMENT DETAILS =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, get } = getDatabase();
    const transactionId = req.params.id;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    const query = `
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.type as transaction_type,
        t.transaction_date,
        t.payment_status_id,
        c.name as category_name,
        co.name as contact_name,
        cc.name as cost_center_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN contacts co ON t.contact_id = co.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      WHERE t.id = ?
    `;
    
    const transaction = await get(db, query, [transactionId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  getFilteredTransactions,
  list,
  getById,
  create,
  update,
  delete: remove,
  markAsPaid,
  reversePayment,
  batchEdit,
  getTransactionStats,
  patch: update,
  getPaymentDetails
};