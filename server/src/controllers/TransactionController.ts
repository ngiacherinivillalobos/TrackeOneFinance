import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

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
}) => {
  const query = `
    INSERT INTO transactions (
      description, amount, type, category_id, subcategory_id,
      payment_status_id, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, is_installment, installment_number, total_installments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { db: database, run } = getDatabase();
  return run(database, query, [
    params.description, params.amount, params.dbType, params.category_id, params.subcategory_id,
    params.currentPaymentStatusId, params.bank_account_id, params.card_id, params.contact_id, 
    params.formattedDate, params.cost_center_id, params.is_installment || false, 
    params.installment_number || null, params.total_installments || null
  ]);
};

const list = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - LIST =====');
  console.log('Query params:', req.query);
  
  try {
    const { db, all } = getDatabase();
    const userId = (req as any).user?.id;
    const userCostCenterId = (req as any).user?.cost_center_id;
    
    // Construir filtros dinamicamente
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    // Filtro por data - aceita tanto start_date/end_date quanto month
    if (req.query.start_date) {
      whereConditions.push('t.transaction_date >= ?');
      queryParams.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      whereConditions.push('t.transaction_date <= ?');
      queryParams.push(req.query.end_date);
    }
    
    // Filtro por mês (formato YYYY-MM) - compatibilidade com página Transactions
    if (req.query.month && !req.query.start_date && !req.query.end_date) {
      const monthStr = req.query.month as string;
      const [year, month] = monthStr.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
      whereConditions.push('t.transaction_date >= ? AND t.transaction_date <= ?');
      queryParams.push(startDate, endDate);
    }
    
    // Filtro por tipo de transação
    if (req.query.transaction_type) {
      const typeMap: any = {
        'Despesa': 'expense',
        'Receita': 'income', 
        'Investimento': 'investment'
      };
      whereConditions.push('t.type = ?');
      queryParams.push(typeMap[req.query.transaction_type as string] || req.query.transaction_type);
    }
    
    // Filtro por categoria
    if (req.query.category_id) {
      whereConditions.push('t.category_id = ?');
      queryParams.push(req.query.category_id);
    }
    
    // Filtro por subcategoria
    if (req.query.subcategory_id) {
      whereConditions.push('t.subcategory_id = ?');
      queryParams.push(req.query.subcategory_id);
    }
    
    // Filtro por status de pagamento - suporta múltiplos valores
    if (req.query.payment_status_id) {
      const statusIds = Array.isArray(req.query.payment_status_id) 
        ? req.query.payment_status_id 
        : req.query.payment_status_id.toString().split(',');
      
      if (statusIds.length > 0) {
        const placeholders = statusIds.map(() => '?').join(',');
        whereConditions.push(`t.payment_status_id IN (${placeholders})`);
        queryParams.push(...statusIds);
      }
    }
    
    // Filtro por contato
    if (req.query.contact_id) {
      whereConditions.push('t.contact_id = ?');
      queryParams.push(req.query.contact_id);
    }
    
    // Filtro por centro de custo - sempre aplicar, mesmo que seja 'all'
    if (req.query.cost_center_id && req.query.cost_center_id !== 'all') {
      console.log('======= PROCESSAMENTO DE FILTRO DE CENTRO DE CUSTO =======');
      console.log('Valor original:', req.query.cost_center_id);
      console.log('Tipo do valor:', typeof req.query.cost_center_id);

      // Verificar se tem vírgula, indicando múltiplos valores
      if (req.query.cost_center_id.toString().includes(',')) {
        // Múltiplos centros de custo separados por vírgula
        const costCenterIds = req.query.cost_center_id.toString().split(',').map(id => id.trim());
        
        // Converter IDs para números e filtrar valores inválidos
        const numericIds = costCenterIds
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
        
        console.log('IDs originais:', costCenterIds);
        console.log('IDs numéricos:', numericIds);
        
        if (numericIds.length > 0) {
          // Construir cláusula IN diretamente na condição
          whereConditions.push(`t.cost_center_id IN (${numericIds.join(',')})`);
          
          // Não adiciona parâmetros já que os IDs estão diretamente na cláusula SQL
          console.log('Cláusula SQL para múltiplos centros:', `t.cost_center_id IN (${numericIds.join(',')})`);
        }
      } else {
        // Único centro de custo
        const costCenterId = parseInt(req.query.cost_center_id.toString(), 10);
        if (!isNaN(costCenterId)) {
          whereConditions.push('t.cost_center_id = ?');
          queryParams.push(costCenterId);
          console.log('Cláusula SQL para centro único:', 't.cost_center_id = ?', costCenterId);
        }
      }
    } else if (userCostCenterId && (!req.query.cost_center_id || req.query.cost_center_id === '')) {
      console.log('Adding cost_center_id filter from user:', userCostCenterId);
      whereConditions.push('t.cost_center_id = ?');
      queryParams.push(userCostCenterId);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const query = `
      SELECT 
        t.*,
        CASE 
          WHEN t.type = 'expense' THEN 'Despesa'
          WHEN t.type = 'income' THEN 'Receita'
          WHEN t.type = 'investment' THEN 'Investimento'
          ELSE t.type
        END as transaction_type,
        c.name as category_name,
        s.name as subcategory_name,
        ps.name as payment_status_name,
        cont.name as contact_name,
        cc.name as cost_center_name,
        cc.number as cost_center_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
      LEFT JOIN contacts cont ON t.contact_id = cont.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      ${whereClause}
      ORDER BY t.transaction_date ASC, t.created_at DESC
    `;

    console.log('SQL query antes de executar:', query);
    console.log('SQL params antes de executar:', queryParams);
          
    // Imprimir a consulta com parâmetros substituídos para depuração
    let debugSql = query;
    for (const param of queryParams) {
      if (typeof param === 'string') {
        debugSql = debugSql.replace('?', `'${param}'`);
      } else if (param === null) {
        debugSql = debugSql.replace('?', 'NULL');
      } else {
        debugSql = debugSql.replace('?', param);
      }
    }
          
    console.log('SQL COMPLETA COM PARÂMETROS:', debugSql);

    const transactions = await all(db, query, queryParams);

    console.log('Found transactions:', transactions.length);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getById = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET BY ID =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, get } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const query = `
      SELECT 
        t.*,
        CASE 
          WHEN t.type = 'expense' THEN 'Despesa'
          WHEN t.type = 'income' THEN 'Receita'
          WHEN t.type = 'investment' THEN 'Investimento'
          ELSE t.type
        END as transaction_type,
        c.name as category_name,
        s.name as subcategory_name,
        ps.name as payment_status_name,
        cont.name as contact_name,
        cc.name as cost_center_name,
        cc.number as cost_center_number,
        card.name as card_name,
        ba.name as bank_account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
      LEFT JOIN contacts cont ON t.contact_id = cont.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      LEFT JOIN cards card ON t.card_id = card.id
      LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
      WHERE t.id = ?
    `;

    const transaction = await get(db, query, [transactionId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const create = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - CREATE =====');
  console.log('Request body:', req.body);
  
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
      is_paid,
      is_installment,
      total_installments
    } = req.body;

    // Use transaction_type se estiver presente, senão usa type
    const finalType = transaction_type || type;

    // Convert Portuguese to English for database compatibility
    let dbType = finalType;
    if (finalType === 'Despesa') dbType = 'expense';
    if (finalType === 'Receita') dbType = 'income';
    if (finalType === 'Investimento') dbType = 'investment';

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
    
    if (is_paid === true) {
      finalPaymentStatusId = 2; // Pago
    }
    else if (payment_status_id === 2) {
      finalPaymentStatusId = 2; // Mantém como Pago
    }
    else if (!payment_status_id && !is_paid) {
      const today = new Date().toISOString().split('T')[0];
      
      if (transaction_date < today) {
        finalPaymentStatusId = 374; // Vencido
      } else {
        finalPaymentStatusId = 1; // Em aberto
      }
    }
    else if (!payment_status_id) {
      finalPaymentStatusId = 1; // Em aberto
    }

    console.log('Creating transaction with payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: new Date().toISOString().split('T')[0],
      final_payment_status_id: finalPaymentStatusId
    });

    // Lógica de recorrência
    if (is_recurring) {
      console.log('Creating recurring transactions');
      let createdTransactions: any[] = [];
      
      // Determinar a data de início e fim
      const startDate = new Date(transaction_date);
      let endDate: Date;
      
      if (recurrence_type === 'fixo' && recurrence_end_date) {
        endDate = new Date(recurrence_end_date);
      } else if (recurrence_type === 'personalizado' && recurrence_count) {
        endDate = new Date(startDate);
        if (recurrence_weekday) {
          // Para recorrência semanal
          endDate.setDate(startDate.getDate() + (recurrence_count * 7));
        } else {
          // Para recorrência mensal
          endDate.setMonth(startDate.getMonth() + recurrence_count);
        }
      } else {
        // Default para 12 meses se não especificado
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 12);
      }

      console.log('Recurrence dates:', { startDate, endDate });

      // Criar transações recorrentes
      let currentDate = new Date(startDate);
      let installmentNumber = 1;
      const totalInstallments = recurrence_type === 'personalizado' && recurrence_count ? recurrence_count : 
                               Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)); // Aproximadamente meses

      while (currentDate <= endDate) {
        console.log('Creating transaction for date:', currentDate.toISOString().split('T')[0]);
        
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        try {
          const result: any = await run(db, `
            INSERT INTO transactions (
              description, amount, type, category_id, subcategory_id,
              payment_status_id, bank_account_id, card_id, contact_id, 
              transaction_date, cost_center_id, is_recurring, recurrence_type,
              is_installment, installment_number, total_installments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            description, amount, dbType, category_id, subcategory_id,
            finalPaymentStatusId, bank_account_id, card_id, contact_id, 
            formattedDate, cost_center_id, true, recurrence_type,
            is_installment || false, installmentNumber, totalInstallments
          ]);

          createdTransactions.push({
            id: result.lastID,
            transaction_date: formattedDate,
            installment_number: installmentNumber,
            total_installments: totalInstallments
          });

          installmentNumber++;

          // Avançar para a próxima data
          if (recurrence_type === 'mensal' || recurrence_type === 'fixo') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (recurrence_type === 'personalizado') {
            if (recurrence_weekday) {
              // Avançar uma semana
              currentDate.setDate(currentDate.getDate() + 7);
            } else {
              // Avançar um mês
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
          } else {
            // Default: avançar um mês
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
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
      
      if (createdTransactions.length > 0) {
        return res.status(201).json({ 
          message: `${createdTransactions.length} recurring transactions created successfully`,
          transactions: createdTransactions,
          count: createdTransactions.length
        });
      }
    }

    // Transação única
    const result: any = await run(db, `
      INSERT INTO transactions (
        description, amount, type, category_id, subcategory_id,
        payment_status_id, bank_account_id, card_id, contact_id, 
        transaction_date, cost_center_id, is_installment, installment_number, total_installments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      description, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, is_installment || false, 
      is_installment ? 1 : null, total_installments || null
    ]);

    res.status(201).json({ 
      id: result.lastID, 
      message: 'Transaction created successfully',
      transaction: {
        id: result.lastID,
        description,
        amount,
        type: dbType,
        category_id,
        subcategory_id,
        payment_status_id: finalPaymentStatusId,
        bank_account_id,
        card_id,
        contact_id,
        transaction_date
      }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction: ' + error });
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
      is_paid,
      is_installment,
      total_installments
    } = req.body;

    // Use transaction_type se estiver presente, senão usa type
    const finalType = transaction_type || type;

    // Convert Portuguese to English for database compatibility
    let dbType = finalType;
    if (finalType === 'Despesa') dbType = 'expense';
    if (finalType === 'Receita') dbType = 'income';
    if (finalType === 'Investimento') dbType = 'investment';

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

    // Lógica para determinar o payment_status_id (mesma do create)
    let finalPaymentStatusId = payment_status_id;
    
    if (is_paid === true) {
      finalPaymentStatusId = 2;
    }
    else if (payment_status_id === 2) {
      finalPaymentStatusId = 2;
    }
    else if (!payment_status_id && !is_paid) {
      const today = new Date().toISOString().split('T')[0];
      
      if (transaction_date < today) {
        finalPaymentStatusId = 4; // Vencido
      } else {
        finalPaymentStatusId = 1; // Em aberto
      }
    }
    else if (!payment_status_id) {
      finalPaymentStatusId = 1;
    }

    console.log('Updating transaction with payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: new Date().toISOString().split('T')[0],
      final_payment_status_id: finalPaymentStatusId
    });

    const result: any = await run(db, `
      UPDATE transactions SET
        description = ?, amount = ?, type = ?, category_id = ?, subcategory_id = ?,
        payment_status_id = ?, bank_account_id = ?, card_id = ?, contact_id = ?, 
        transaction_date = ?, cost_center_id = ?, is_installment = ?, total_installments = ?
      WHERE id = ?
    `, [
      description, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, is_installment || false, 
      total_installments || null, transactionId
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ 
      message: 'Transaction updated successfully',
      transactionId: transactionId
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction: ' + error });
  }
};

const patchTransaction = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - PATCH (BATCH EDIT) =====');
  console.log('Request body:', req.body);
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run } = getDatabase();
    const transactionId = req.params.id;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Construir query dinamicamente com apenas os campos fornecidos
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    const {
      amount,
      contact_id,
      category_id,
      subcategory_id,
      cost_center_id,
      description,
      transaction_date,
      payment_status_id
    } = req.body;

    // Adicionar campos apenas se estiverem presentes
    if (amount !== undefined && amount !== null) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }

    if (contact_id !== undefined && contact_id !== null && contact_id !== '') {
      updateFields.push('contact_id = ?');
      updateValues.push(contact_id);
    }

    if (category_id !== undefined && category_id !== null && category_id !== '') {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }

    if (subcategory_id !== undefined && subcategory_id !== null && subcategory_id !== '') {
      updateFields.push('subcategory_id = ?');
      updateValues.push(subcategory_id);
    }

    if (cost_center_id !== undefined && cost_center_id !== null && cost_center_id !== '') {
      updateFields.push('cost_center_id = ?');
      updateValues.push(cost_center_id);
    }

    if (description !== undefined && description !== null && description !== '') {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (transaction_date !== undefined && transaction_date !== null && transaction_date !== '') {
      updateFields.push('transaction_date = ?');
      updateValues.push(transaction_date);
    }

    if (payment_status_id !== undefined && payment_status_id !== null) {
      updateFields.push('payment_status_id = ?');
      updateValues.push(payment_status_id);
    }

    // Se nenhum campo foi fornecido para atualização
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    // Adicionar ID da transação ao final dos parâmetros
    updateValues.push(transactionId);

    const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('PATCH Query:', query);
    console.log('PATCH Values:', updateValues);

    const result: any = await run(db, query, updateValues);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ 
      message: 'Transaction updated successfully',
      transactionId: transactionId,
      updatedFields: updateFields.length
    });
  } catch (error) {
    console.error('Error patching transaction:', error);
    res.status(500).json({ error: 'Failed to patch transaction: ' + error });
  }
};

const deleteTransaction = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - DELETE =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, run } = getDatabase();
    const transactionId = req.params.id;

    // Validate transaction ID
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const result: any = await run(db, `DELETE FROM transactions WHERE id = ?`, [transactionId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ 
      message: 'Transaction deleted successfully',
      transactionId: transactionId
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction: ' + error });
  }
};

const markAsPaid = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - MARK AS PAID =====');
  console.log('Transaction ID:', req.params.id);
  console.log('Payment data:', req.body);
  
  try {
    const { db, get, run } = getDatabase();
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

    // Validar dados obrigatórios
    if (!payment_date || !paid_amount || !payment_type) {
      return res.status(400).json({ 
        error: 'Payment date, paid amount and payment type are required' 
      });
    }

    if (payment_type === 'bank_account' && !bank_account_id) {
      return res.status(400).json({ error: 'Bank account is required for bank account payments' });
    }

    if (payment_type === 'credit_card' && !card_id) {
      return res.status(400).json({ error: 'Credit card is required for credit card payments' });
    }

    // Buscar a transação original
    const transaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Iniciar transação do banco
    await run(db, 'BEGIN TRANSACTION');

    try {
      // 1. Atualizar status da transação para "Pago" (id: 2)
      await run(db, 'UPDATE transactions SET payment_status_id = ? WHERE id = ?', [2, transactionId]);

      // 2. Inserir detalhes do pagamento
      await run(db, `
        INSERT INTO payment_details (
          transaction_id, payment_date, paid_amount, original_amount,
          payment_type, bank_account_id, card_id, discount_amount,
          interest_amount, observations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId,
        payment_date,
        paid_amount,
        transaction.amount,
        payment_type,
        payment_type === 'bank_account' ? bank_account_id : null,
        payment_type === 'credit_card' ? card_id : null,
        discount || 0,
        interest || 0,
        observations || ''
      ]);

      // Confirmar transação
      await run(db, 'COMMIT');

      console.log('Transaction marked as paid successfully');
      res.json({ 
        message: 'Transaction marked as paid successfully',
        payment_details: {
          transaction_id: transactionId,
          payment_date,
          paid_amount,
          original_amount: transaction.amount,
          discount: discount || 0,
          interest: interest || 0
        }
      });
    } catch (error) {
      // Rollback em caso de erro
      await run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error marking transaction as paid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPaymentDetails = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET PAYMENT DETAILS =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, all } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const query = `
      SELECT 
        pd.*,
        ba.name as bank_account_name,
        c.name as card_name
      FROM payment_details pd
      LEFT JOIN bank_accounts ba ON pd.bank_account_id = ba.id
      LEFT JOIN cards c ON pd.card_id = c.id
      WHERE pd.transaction_id = ?
      ORDER BY pd.created_at DESC
    `;

    const paymentDetails = await all(db, query, [transactionId]);

    res.json(paymentDetails);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePaymentStatus = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - UPDATE PAYMENT STATUS =====');
  console.log('Transaction ID:', req.params.id);
  console.log('New status ID:', req.body.status_id);
  
  try {
    const { db, get, run } = getDatabase();
    const transactionId = req.params.id;
    const { status_id: newStatusId } = req.body;

    if (!transactionId || !newStatusId) {
      return res.status(400).json({ error: 'Transaction ID and status ID are required' });
    }

    // Buscar a transação original
    const transaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Iniciar transação do banco
    await run(db, 'BEGIN TRANSACTION');

    try {
      // 1. Atualizar status da transação
      await run(db, 'UPDATE transactions SET payment_status_id = ? WHERE id = ?', [newStatusId, transactionId]);

      // 2. Se estiver marcando como "Pago", inserir detalhes do pagamento
      if (newStatusId == 2) { // Pago
        // Inserir registro básico de pagamento
        await run(db, `
          INSERT INTO payment_details (
            transaction_id, payment_date, paid_amount, original_amount,
            payment_type
          ) VALUES (?, DATE('now'), ?, ?, 'manual')
        `, [
          transactionId,
          transaction.amount,
          transaction.amount
        ]);
      }

      // Confirmar transação
      await run(db, 'COMMIT');

      console.log('Transaction status updated successfully');
      res.json({ 
        message: 'Transaction status updated successfully',
        transaction_id: transactionId,
        new_status_id: newStatusId
      });
    } catch (error) {
      // Rollback em caso de erro
      await run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const reversePayment = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - REVERSE PAYMENT =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const { db, get, run } = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Buscar a transação original
    const transaction = await get(db, 'SELECT * FROM transactions WHERE id = ?', [transactionId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Iniciar transação do banco
    await run(db, 'BEGIN TRANSACTION');

    try {
      // 1. Atualizar status da transação para "Em aberto" (id: 1)
      await run(db, 'UPDATE transactions SET payment_status_id = ? WHERE id = ?', [1, transactionId]);

      // 2. Remover detalhes do pagamento
      await run(db, 'DELETE FROM payment_details WHERE transaction_id = ?', [transactionId]);

      // Confirmar transação
      await run(db, 'COMMIT');

      console.log('Transaction payment reversed successfully');
      res.json({ 
        message: 'Transaction payment reversed successfully',
        transaction_id: transactionId
      });
    } catch (error) {
      // Rollback em caso de erro
      await run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error reversing transaction payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  list,
  getById,
  create,
  update,
  delete: deleteTransaction,
  markAsPaid,
  getPaymentDetails,
  updatePaymentStatus,
  reversePayment,
  patch: patchTransaction  // Nova função para edição em lote
};
