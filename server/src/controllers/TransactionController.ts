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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return new Promise<any>((resolve, reject) => {
    db.run(query, [
      params.description, params.amount, params.dbType, params.category_id, params.subcategory_id,
      params.currentPaymentStatusId, params.bank_account_id, params.card_id, params.contact_id, 
      params.formattedDate, params.cost_center_id, params.is_installment || false, 
      params.installment_number || null, params.total_installments || null
    ], function(this: any, err: any) {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        console.log('Transaction created with ID:', this.lastID);
        resolve({ lastID: this.lastID });
      }
    });
  });
};

const list = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - LIST =====');
  console.log('Query params:', req.query);
  
  try {
    const db = getDatabase();
    
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
    
    // Filtro por centro de custo
    if (req.query.cost_center_id) {
      console.log('Adding cost_center_id filter:', req.query.cost_center_id);
      whereConditions.push('t.cost_center_id = ?');
      queryParams.push(req.query.cost_center_id);
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
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;

    console.log('Executing query:', query);
    console.log('With params:', queryParams);

    const transactions = await new Promise<any[]>((resolve, reject) => {
      db.all(query, queryParams, (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

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
    const db = getDatabase();
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
        cc.number as cost_center_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN payment_status ps ON t.payment_status_id = ps.id
      LEFT JOIN contacts cont ON t.contact_id = cont.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      WHERE t.id = ?
    `;

    const transaction = await new Promise<any>((resolve, reject) => {
      db.get(query, [transactionId], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log('Found transaction:', transaction);
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
    const db = getDatabase();
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
      recurrence_days, // Para recorrência personalizada (a cada X dias)
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
    
    // Se is_paid for verdadeiro, define como "Pago" (id: 2)
    if (is_paid === true) {
      finalPaymentStatusId = 2;
    }
    // Se payment_status_id for 2, considera como pago
    else if (payment_status_id === 2) {
      finalPaymentStatusId = 2;
    }
    // Se não for informado payment_status_id e não está marcado como pago
    else if (!payment_status_id && !is_paid) {
      const today = new Date().toISOString().split('T')[0]; // Data de hoje no formato YYYY-MM-DD
      
      // Se a data da transação é anterior a hoje e não está marcada como pago, define como "Vencido" (id: 4)
      if (transaction_date < today) {
        finalPaymentStatusId = 4; // Vencido
      } else {
        finalPaymentStatusId = 1; // Em aberto
      }
    }
    // Se não for informado, padrão é "Em aberto" (id: 1)
    else if (!payment_status_id) {
      finalPaymentStatusId = 1;
    }

    console.log('Calculated payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: new Date().toISOString().split('T')[0],
      final_payment_status_id: finalPaymentStatusId
    });

    console.log('Parameters for insertion:', {
      description, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id
    });

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

    console.log('Recurrence parameters:', {
      is_recurring, 
      recurrence_type, 
      recurrence_count,
      recurrence_end_date,
      recurrence_weekday,
      recurrence_count_type: typeof recurrence_count,
      condition_check_count: is_recurring && (recurrence_type === 'mensal' || recurrence_type === 'semanal') && recurrence_count > 1,
      condition_check_fixed: is_recurring && recurrence_type === 'fixo' && recurrence_end_date
    });

    console.log('Installment parameters:', {
      is_installment, 
      total_installments,
      condition_check: is_installment && total_installments > 1
    });

    // Se for transação parcelada
    if (is_installment && total_installments > 1) {
      console.log('=== INSTALLMENT DEBUG ===');
      console.log('is_installment:', is_installment, typeof is_installment);
      console.log('total_installments:', total_installments, typeof total_installments);
      console.log('Creating installment transactions:', { total_installments });
      
      const createdTransactions = [];
      
      for (let i = 1; i <= total_installments; i++) {
        // Calcular a data de cada parcela (mensalmente)
        const installmentDate = new Date(transaction_date);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
        
        // Corrigir overflow de dias no mês
        const originalDay = new Date(transaction_date).getDate();
        const lastDayOfMonth = new Date(installmentDate.getFullYear(), installmentDate.getMonth() + 1, 0).getDate();
        if (originalDay > lastDayOfMonth) {
          installmentDate.setDate(lastDayOfMonth);
        } else {
          installmentDate.setDate(originalDay);
        }
        
        const formattedDate = installmentDate.toISOString().split('T')[0];
        
        // Calcular payment_status_id para cada parcela baseado na sua data
        let currentPaymentStatusId = finalPaymentStatusId;
        if (!is_paid && payment_status_id !== 2) {
          const today = new Date().toISOString().split('T')[0];
          if (formattedDate < today) {
            currentPaymentStatusId = 4; // Vencido
          } else {
            currentPaymentStatusId = 1; // Em aberto
          }
        }

        const result = await createSingleTransaction(db, {
          description, amount, dbType, category_id, subcategory_id,
          currentPaymentStatusId, bank_account_id, card_id, contact_id, 
          formattedDate, cost_center_id, is_installment: true,
          installment_number: i, total_installments
        });
        
        createdTransactions.push({
          id: result.lastID,
          description,
          amount,
          type: dbType,
          category_id,
          subcategory_id,
          payment_status_id: currentPaymentStatusId,
          bank_account_id,
          card_id,
          contact_id,
          transaction_date: formattedDate,
          cost_center_id,
          is_installment: true,
          installment_number: i,
          total_installments
        });
      }
      
      if (createdTransactions.length > 0) {
        return res.status(201).json({ 
          message: `${createdTransactions.length} installment transactions created successfully`,
          transactions: createdTransactions,
          count: createdTransactions.length
        });
      }
    }

    // Se for transação recorrente
    if (is_recurring && recurrence_type) {
      console.log('=== RECURRENCE DEBUG ===');
      console.log('is_recurring:', is_recurring, typeof is_recurring);
      console.log('recurrence_type:', recurrence_type, typeof recurrence_type);
      console.log('recurrence_count:', recurrence_count, typeof recurrence_count);
      console.log('Creating recurring transactions:', { recurrence_type, recurrence_count, recurrence_end_date });
      
      const createdTransactions = [];
      let currentDate = new Date(transaction_date);
      let count = 0;
      const maxTransactions = 100; // limitador de segurança
      
      // Tipo "fixo" - criar até a data de finalização
      if (recurrence_type === 'fixo' && recurrence_end_date) {
        const endDate = new Date(recurrence_end_date);
        
        while (currentDate <= endDate && count < maxTransactions) {
          const formattedDate = currentDate.toISOString().split('T')[0];
          
          // Calcular payment_status_id para cada transação baseado na sua data
          let currentPaymentStatusId = finalPaymentStatusId;
          if (!is_paid && payment_status_id !== 2) {
            const today = new Date().toISOString().split('T')[0];
            if (formattedDate < today) {
              currentPaymentStatusId = 4; // Vencido
            } else {
              currentPaymentStatusId = 1; // Em aberto
            }
          }

          const result = await createSingleTransaction(db, {
            description, amount, dbType, category_id, subcategory_id,
            currentPaymentStatusId, bank_account_id, card_id, contact_id, 
            formattedDate, cost_center_id
          });
          
          createdTransactions.push({
            id: result.lastID,
            description,
            amount,
            type: dbType,
            category_id,
            subcategory_id,
            payment_status_id: currentPaymentStatusId,
            bank_account_id,
            card_id,
            contact_id,
            transaction_date: formattedDate,
            cost_center_id
          });

          // Avançar para o próximo mês com correção de overflow
          const originalDay = currentDate.getDate();
          const nextMonth = currentDate.getMonth() + 1;
          const nextYear = currentDate.getFullYear();
          
          // Criar data do próximo mês
          const nextDate = new Date(nextYear, nextMonth, 1);
          const maxDayInNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          
          if (originalDay > maxDayInNextMonth) {
            // Se o dia original não existe no próximo mês, usar o último dia
            currentDate = new Date(nextYear, nextMonth, maxDayInNextMonth);
          } else {
            // Se o dia existe, usar o dia original
            currentDate = new Date(nextYear, nextMonth, originalDay);
          }
          count++;
        }
      }
      // Tipos com quantidade definida (mensal, semanal e personalizado)
      else if ((recurrence_type === 'mensal' || recurrence_type === 'semanal' || recurrence_type === 'personalizado') && recurrence_count > 1) {
        // Calcular a data base para começar as recorrências usando construção explícita para evitar problemas de timezone
        const dateParts = transaction_date.split('-').map((part: string) => parseInt(part));
        let startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // month is 0-indexed
        
        // Para semanal, armazenar o dia da semana especificado para as próximas recorrências
        let targetWeekday = null;
        if (recurrence_type === 'semanal' && recurrence_weekday) {
          targetWeekday = parseInt(recurrence_weekday);
          
          console.log('Semanal debug:', {
            originalDate: transaction_date,
            targetWeekday,
            currentDay: startDate.getDay(),
            startDateBefore: startDate.toISOString().split('T')[0]
          });
        }
        
        for (let i = 0; i < recurrence_count; i++) {
          // Calcular a data para cada transação
          currentDate = new Date(startDate);
          
          if (recurrence_type === 'mensal') {
            // Para mensal, avançar i meses
            const originalDay = startDate.getUTCDate();
            currentDate = new Date(startDate);
            
            // Calcular o mês e ano alvo
            const targetMonth = startDate.getUTCMonth() + i;
            const targetYear = startDate.getUTCFullYear() + Math.floor(targetMonth / 12);
            const adjustedMonth = targetMonth % 12;
            
            // Tentar criar a data com o dia original
            currentDate = new Date(Date.UTC(targetYear, adjustedMonth, originalDay));
            
            // Se o dia mudou (overflow), usar o último dia do mês
            if (currentDate.getUTCDate() !== originalDay) {
              currentDate = new Date(Date.UTC(targetYear, adjustedMonth + 1, 0));
            }
          } else if (recurrence_type === 'semanal') {
            if (i === 0) {
              // Primeira transação: usar a data original do registro
              currentDate = new Date(startDate);
            } else {
              // Próximas transações: usar o dia da semana especificado
              if (targetWeekday !== null) {
                // Para a segunda transação e subsequentes, 
                // calcular a próxima ocorrência do dia da semana especificado
                if (i === 1) {
                  // Segunda transação: encontrar a próxima ocorrência do dia alvo após a data inicial
                  const currentWeekDay = startDate.getDay();
                  let daysToAdd = (targetWeekday - currentWeekDay + 7) % 7;
                  
                  // Se o dia alvo é o mesmo dia da semana da data inicial, avançar uma semana
                  if (daysToAdd === 0) {
                    daysToAdd = 7;
                  }
                  
                  currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + daysToAdd);
                } else {
                  // Terceira transação em diante: avançar semanas a partir da segunda transação
                  const secondTransactionWeekDay = startDate.getDay();
                  let daysToSecondTransaction = (targetWeekday - secondTransactionWeekDay + 7) % 7;
                  if (daysToSecondTransaction === 0) {
                    daysToSecondTransaction = 7;
                  }
                  
                  currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + daysToSecondTransaction + (7 * (i - 1)));
                }
                
                console.log(`Semana ${i}: result=${currentDate.toISOString().split('T')[0]}`);
              } else {
                // Se não tem dia da semana especificado, usar a lógica antiga
                currentDate.setDate(currentDate.getDate() + (7 * i));
              }
            }
          } else if (recurrence_type === 'personalizado' && recurrence_days) {
            // Para personalizado, adicionar recurrence_days dias * i
            const daysToAdd = parseInt(recurrence_days) * i;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
          }
          
          const formattedDate = currentDate.toISOString().split('T')[0];
          
          // Calcular payment_status_id para cada transação baseado na sua data
          let currentPaymentStatusId = finalPaymentStatusId;
          if (!is_paid && payment_status_id !== 2) {
            const today = new Date().toISOString().split('T')[0];
            if (formattedDate < today) {
              currentPaymentStatusId = 4; // Vencido
            } else {
              currentPaymentStatusId = 1; // Em aberto
            }
          }

          const result = await createSingleTransaction(db, {
            description, amount, dbType, category_id, subcategory_id,
            currentPaymentStatusId, bank_account_id, card_id, contact_id, 
            formattedDate, cost_center_id
          });
          
          createdTransactions.push({
            id: result.lastID,
            description,
            amount,
            type: dbType,
            category_id,
            subcategory_id,
            payment_status_id: currentPaymentStatusId,
            bank_account_id,
            card_id,
            contact_id,
            transaction_date: formattedDate,
            cost_center_id
          });
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
    const query = `
      INSERT INTO transactions (
        description, amount, type, category_id, subcategory_id,
        payment_status_id, bank_account_id, card_id, contact_id, 
        transaction_date, cost_center_id, is_installment, installment_number, total_installments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await new Promise<any>((resolve, reject) => {
      db.run(query, [
        description, amount, dbType, category_id, subcategory_id,
        finalPaymentStatusId, bank_account_id, card_id, contact_id, 
        transaction_date, cost_center_id, is_installment || false, 
        is_installment ? 1 : null, total_installments || null
      ], function(this: any, err: any) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Transaction created with ID:', this.lastID);
          resolve({ lastID: this.lastID });
        }
      });
    });

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
    const db = getDatabase();
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

    const query = `
      UPDATE transactions SET
        description = ?, amount = ?, type = ?, category_id = ?, subcategory_id = ?,
        payment_status_id = ?, bank_account_id = ?, card_id = ?, contact_id = ?, 
        transaction_date = ?, cost_center_id = ?, is_installment = ?, total_installments = ?
      WHERE id = ?
    `;

    const result = await new Promise<any>((resolve, reject) => {
      db.run(query, [
        description, amount, dbType, category_id, subcategory_id,
        finalPaymentStatusId, bank_account_id, card_id, contact_id, 
        transaction_date, cost_center_id, is_installment || false, 
        total_installments || null, transactionId
      ], function(this: any, err: any) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Transaction updated, changes:', this.changes);
          resolve({ changes: this.changes });
        }
      });
    });

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

const deleteTransaction = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - DELETE =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const db = getDatabase();
    const transactionId = req.params.id;

    // Validate transaction ID
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const query = `DELETE FROM transactions WHERE id = ?`;

    const result = await new Promise<any>((resolve, reject) => {
      db.run(query, [transactionId], function(this: any, err: any) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Transaction deleted, changes:', this.changes);
          resolve({ changes: this.changes });
        }
      });
    });

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
    const db = getDatabase();
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
    const transaction = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ?', [transactionId], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Iniciar transação do banco
    await new Promise<void>((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // 1. Atualizar status da transação para "Pago" (id: 2)
      await new Promise<void>((resolve, reject) => {
        const updateQuery = 'UPDATE transactions SET payment_status_id = ? WHERE id = ?';
        db.run(updateQuery, [2, transactionId], (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // 2. Inserir detalhes do pagamento
      await new Promise<void>((resolve, reject) => {
        const insertQuery = `
          INSERT INTO payment_details (
            transaction_id, payment_date, paid_amount, original_amount,
            payment_type, bank_account_id, card_id, discount_amount,
            interest_amount, observations
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertQuery, [
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
        ], (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Confirmar transação
      await new Promise<void>((resolve, reject) => {
        db.run('COMMIT', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

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
      await new Promise<void>((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
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
    const db = getDatabase();
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

    const paymentDetails = await new Promise<any[]>((resolve, reject) => {
      db.all(query, [transactionId], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    res.json(paymentDetails);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const reversePayment = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - REVERSE PAYMENT =====');
  console.log('Transaction ID:', req.params.id);
  
  try {
    const db = getDatabase();
    const transactionId = req.params.id;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Buscar a transação original
    const transaction = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ?', [transactionId], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verificar se a transação está paga
    if (transaction.payment_status_id !== 2) {
      return res.status(400).json({ error: 'Transaction is not paid, cannot reverse payment' });
    }

    // Iniciar transação do banco
    await new Promise<void>((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // 1. Determinar o novo status baseado na data da transação
      const today = new Date().toISOString().split('T')[0];
      const transactionDate = transaction.transaction_date;
      let newStatusId = 1; // Em aberto (padrão)
      
      if (transactionDate < today) {
        newStatusId = 4; // Vencido
      }

      // 2. Atualizar status da transação
      await new Promise<void>((resolve, reject) => {
        const updateQuery = 'UPDATE transactions SET payment_status_id = ? WHERE id = ?';
        db.run(updateQuery, [newStatusId, transactionId], (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // 3. Remover detalhes do pagamento
      await new Promise<void>((resolve, reject) => {
        const deleteQuery = 'DELETE FROM payment_details WHERE transaction_id = ?';
        db.run(deleteQuery, [transactionId], (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Confirmar transação
      await new Promise<void>((resolve, reject) => {
        db.run('COMMIT', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('Payment reversed successfully');
      res.json({ 
        message: 'Payment reversed successfully',
        transaction_id: transactionId,
        new_status_id: newStatusId
      });
    } catch (error) {
      // Rollback em caso de erro
      await new Promise<void>((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }
  } catch (error) {
    console.error('Error reversing payment:', error);
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
  reversePayment
};
