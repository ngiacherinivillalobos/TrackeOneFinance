import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import { toDatabaseBoolean } from '../utils/booleanUtils';

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
  const isProduction = process.env.NODE_ENV === 'production';
  const query = `
    INSERT INTO transactions (
      description, amount, type, category_id, subcategory_id,
      payment_status_id, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, is_installment, installment_number, total_installments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { db: database, run } = getDatabase();
  return run(database, query, [
    params.description, params.amount, params.dbType, params.category_id, params.subcategory_id,
    params.currentPaymentStatusId, params.bank_account_id, params.card_id, params.contact_id, 
    params.formattedDate, params.cost_center_id, toDatabaseBoolean(params.is_installment, isProduction), 
    params.installment_number || null, params.total_installments || null
  ]);
};

const list = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - LIST =====');
  console.log('Query params:', req.query);
  console.log('User info:', (req as any).user);
  
  try {
    const { db, all } = getDatabase();
    const userId = (req as any).user?.id;
    const userCostCenterId = (req as any).user?.cost_center_id;
    
    console.log('User ID:', userId);
    console.log('User Cost Center ID:', userCostCenterId);
    
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
    } else if (userCostCenterId && (!req.query.cost_center_id || req.query.cost_center_id === '' || req.query.cost_center_id === 'all')) {
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
        CASE
          WHEN t.payment_status_id = 2 THEN 1
          ELSE 0
        END as is_paid,
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
    
    // Formatar as datas consistentemente entre ambientes
    const formattedTransactions = transactions.map((transaction: any) => {
      // Se transaction_date for um objeto Date (PostgreSQL), converter para string no formato YYYY-MM-DD
      if (transaction.transaction_date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        transaction.transaction_date = transaction.transaction_date.toISOString().split('T')[0];
      }
      
      // Garantir que o campo amount seja sempre um número
      if (typeof transaction.amount === 'string') {
        transaction.amount = parseFloat(transaction.amount);
      }
      
      // Converter is_paid de inteiro para booleano
      transaction.is_paid = transaction.is_paid === 1;
      
      // Se já estiver no formato string (SQLite), manter como está
      return transaction;
    });
    
    res.json(formattedTransactions);
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
        CASE
          WHEN t.payment_status_id = 2 THEN 1
          ELSE 0
        END as is_paid,
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
    
    // Formatar a data consistentemente entre ambientes
    if (transaction.transaction_date instanceof Date) {
      // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
      transaction.transaction_date = transaction.transaction_date.toISOString().split('T')[0];
    }
    
    // Garantir que o campo amount seja sempre um número
    if (typeof transaction.amount === 'string') {
      transaction.amount = parseFloat(transaction.amount);
    }
    
    // Converter is_paid de inteiro para booleano
    transaction.is_paid = transaction.is_paid === 1;
    
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

    // Lógica de transações parceladas (não recorrentes)
    if (is_installment && total_installments && total_installments > 1) {
      console.log('Creating installment transactions');
      let createdTransactions: any[] = [];
      let errors: any[] = [];
      
      // Garantir que total_installments é um número
      const totalInstallmentsNum = typeof total_installments === 'string' ? parseInt(total_installments) : total_installments;
      
      // Criar transações parceladas com datas diferentes para cada mês
      const baseDate = new Date(transaction_date);
      
      for (let i = 1; i <= totalInstallmentsNum; i++) {
        console.log(`Creating installment ${i} of ${totalInstallmentsNum}`);
        
        // Calcular a data para esta parcela (adicionando meses)
        const installmentDate = new Date(baseDate);
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
      const startDate = new Date(transaction_date);
      let endDate: Date;
      let maxRecurrences: number;
      
      // Se for recorrência personalizada com quantidade definida
      if (recurrence_type === 'personalizado' && recurrence_count) {
        maxRecurrences = parseInt(recurrence_count);
        if (recurrence_weekday) {
          // Para recorrência semanal
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (maxRecurrences * 7));
        } else {
          // Para recorrência mensal
          endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + maxRecurrences);
        }
      } 
      // Se for recorrência fixa com data final definida
      else if (recurrence_type === 'fixo' && recurrence_end_date) {
        endDate = new Date(recurrence_end_date);
        // Calcular o número de recorrências baseado na data final
        let tempDate = new Date(startDate);
        maxRecurrences = 0;
        while (tempDate <= endDate) {
          maxRecurrences++;
          tempDate.setMonth(tempDate.getMonth() + 1);
        }
      } 
      // Se for recorrência mensal com quantidade definida
      else if (recurrence_type === 'mensal' && recurrence_count) {
        maxRecurrences = parseInt(recurrence_count);
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + maxRecurrences);
      }
      // Default para 12 meses se não especificado
      else {
        maxRecurrences = 12;
        endDate = new Date(startDate);
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
      let currentDate = new Date(startDate);
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
            const nextDate = new Date(currentDate);
            nextDate.setMonth(currentDate.getMonth() + 1);
            
            // Ajustar o dia se necessário (para meses com menos dias)
            if (nextDate.getDate() !== currentDate.getDate()) {
              // Isso acontece quando o dia não existe no mês (ex: 31 de janeiro -> 31 de fevereiro)
              nextDate.setDate(0); // Vai para o último dia do mês anterior
            }
            
            currentDate = nextDate;
          } else if (recurrence_type === 'personalizado') {
            if (recurrence_weekday) {
              // Avançar uma semana
              currentDate.setDate(currentDate.getDate() + 7);
            } else {
              // Avançar um mês, usando a mesma lógica das transações parceladas
              const nextDate = new Date(currentDate);
              nextDate.setMonth(currentDate.getMonth() + 1);
              
              // Ajustar o dia se necessário (para meses com menos dias)
              if (nextDate.getDate() !== currentDate.getDate()) {
                // Isso acontece quando o dia não existe no mês (ex: 31 de janeiro -> 31 de fevereiro)
                nextDate.setDate(0); // Vai para o último dia do mês anterior
              }
              
              currentDate = nextDate;
            }
          } else {
            // Default: avançar um mês, usando a mesma lógica das transações parceladas
            const nextDate = new Date(currentDate);
            nextDate.setMonth(currentDate.getMonth() + 1);
            
            // Ajustar o dia se necessário (para meses com menos dias)
            if (nextDate.getDate() !== currentDate.getDate()) {
              // Isso acontece quando o dia não existe no mês (ex: 31 de janeiro -> 31 de fevereiro)
              nextDate.setDate(0); // Vai para o último dia do mês anterior
            }
            
            currentDate = nextDate;
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
    if (!is_installment && !is_recurring) {
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
    } else if (is_installment || is_recurring) {
      // Se chegou aqui e não criou transações parceladas ou recorrentes, retornar erro
      return res.status(400).json({ error: 'Failed to create installment or recurring transactions' });
    }
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

    console.log('Updating transaction with payment status:', {
      original_payment_status_id: payment_status_id,
      is_paid,
      transaction_date,
      today: new Date().toISOString().split('T')[0],
      final_payment_status_id: finalPaymentStatusId
    });

    // Atualizar transação única
    const isProduction = process.env.NODE_ENV === 'production';
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
        recurrence_weekday = ?,
        is_paid = ?,
        is_installment = ?,
        installment_number = ?,
        total_installments = ?
      WHERE id = ?
    `, [
      description, amount, dbType, category_id, subcategory_id,
      finalPaymentStatusId, bank_account_id, card_id, contact_id, 
      transaction_date, cost_center_id, toDatabaseBoolean(is_recurring, isProduction),
      recurrence_type,
      recurrence_count,
      recurrence_end_date,
      recurrence_weekday,
      toDatabaseBoolean(is_paid, isProduction),
      toDatabaseBoolean(is_installment, isProduction),
      null, // installment_number
      total_installments,
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
        recurrence_weekday,
        is_paid: toDatabaseBoolean(is_paid, isProduction),
        is_installment: toDatabaseBoolean(is_installment, isProduction),
        total_installments
      }
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    res.json({ message: 'Transaction removed successfully' });
  } catch (error) {
    console.error('Error removing transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
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

const batchEdit = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - BATCH EDIT =====');
  console.log('Request body:', req.body);
  
  try {
    const { db, run } = getDatabase();
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions provided for batch edit' });
    }

    // Iniciar transação do banco
    await run(db, 'BEGIN TRANSACTION');

    try {
      for (const transaction of transactions) {
        const {
          id,
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
        } = transaction;

        // Use transaction_type se estiver presente, senão usa type
        const finalType = transaction_type || type;

        // Convert Portuguese to English for database compatibility
        let dbType = finalType;
        if (finalType === 'Despesa') dbType = 'expense';
        if (finalType === 'Receita') dbType = 'income';
        if (finalType === 'Investimento') dbType = 'investment';

        // Validate required fields
        if (!id || !description || !amount || !finalType || !transaction_date) {
          throw new Error(`Missing required fields for transaction ID ${id}: description, amount, type, transaction_date`);
        }

        // Validate mandatory fields: category, contact, and cost center
        if (!category_id && category_id !== 0) {
          throw new Error(`Categoria é obrigatória para transaction ID ${id}`);
        }
        if (!contact_id && contact_id !== 0) {
          throw new Error(`Contato é obrigatório para transaction ID ${id}`);
        }
        if (!cost_center_id && cost_center_id !== 0) {
          throw new Error(`Centro de Custo é obrigatório para transaction ID ${id}`);
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

        console.log(`Updating transaction with payment status for ID ${id}:`, {
          original_payment_status_id: payment_status_id,
          is_paid,
          transaction_date,
          today: new Date().toISOString().split('T')[0],
          final_payment_status_id: finalPaymentStatusId
        });

        const isProduction = process.env.NODE_ENV === 'production';
        const result: any = await run(db, `
          UPDATE transactions SET
            description = ?, amount = ?, type = ?, category_id = ?, subcategory_id = ?,
            payment_status_id = ?, bank_account_id = ?, card_id = ?, contact_id = ?, 
            transaction_date = ?, cost_center_id = ?, is_installment = ?, total_installments = ?,
            is_recurring = ?
          WHERE id = ?
        `, [
          description, amount, dbType, category_id, subcategory_id,
          finalPaymentStatusId, bank_account_id, card_id, contact_id, 
          transaction_date, cost_center_id, toDatabaseBoolean(is_installment, isProduction), 
          total_installments || null, toDatabaseBoolean(is_recurring, isProduction),
          id
        ]);

        if (result.changes === 0) {
          throw new Error(`Transaction not found for ID ${id}`);
        }
      }

      // Confirmar transação
      await run(db, 'COMMIT');

      res.json({ 
        message: 'Transactions updated successfully',
        count: transactions.length
      });
    } catch (error) {
      // Rollback em caso de erro
      await run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating transactions in batch:', error);
    res.status(500).json({ error: 'Failed to update transactions in batch: ' + error });
  }
};

const getTransactionStats = async (req: Request, res: Response) => {
  console.log('===== TRANSACTION CONTROLLER - GET TRANSACTION STATS =====');
  console.log('Query params:', req.query);
  console.log('User info:', (req as any).user);
  
  try {
    const { db, get } = getDatabase();
    const userId = (req as any).user?.id;
    const userCostCenterId = (req as any).user?.cost_center_id;
    
    console.log('User ID:', userId);
    console.log('User Cost Center ID:', userCostCenterId);
    
    // Construir filtros dinamicamente
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    
    // Filtro por data - aceita tanto start_date/end_date quanto month
    if (req.query.start_date) {
      whereConditions.push('transaction_date >= ?');
      queryParams.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      whereConditions.push('transaction_date <= ?');
      queryParams.push(req.query.end_date);
    }
    
    // Filtro por mês (formato YYYY-MM) - compatibilidade com página Transactions
    if (req.query.month && !req.query.start_date && !req.query.end_date) {
      const monthStr = req.query.month as string;
      const [year, month] = monthStr.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
      whereConditions.push('transaction_date >= ? AND transaction_date <= ?');
      queryParams.push(startDate, endDate);
    }
    
    // Filtro por tipo de transação
    if (req.query.transaction_type) {
      const typeMap: any = {
        'Despesa': 'expense',
        'Receita': 'income', 
        'Investimento': 'investment'
      };
      whereConditions.push('type = ?');
      queryParams.push(typeMap[req.query.transaction_type as string] || req.query.transaction_type);
    }
    
    // Filtro por categoria
    if (req.query.category_id) {
      whereConditions.push('category_id = ?');
      queryParams.push(req.query.category_id);
    }
    
    // Filtro por subcategoria
    if (req.query.subcategory_id) {
      whereConditions.push('subcategory_id = ?');
      queryParams.push(req.query.subcategory_id);
    }
    
    // Filtro por status de pagamento - suporta múltiplos valores
    if (req.query.payment_status_id) {
      const statusIds = Array.isArray(req.query.payment_status_id) 
        ? req.query.payment_status_id 
        : req.query.payment_status_id.toString().split(',');
      
      if (statusIds.length > 0) {
        const placeholders = statusIds.map(() => '?').join(',');
        whereConditions.push(`payment_status_id IN (${placeholders})`);
        queryParams.push(...statusIds);
      }
    }
    
    // Filtro por contato
    if (req.query.contact_id) {
      whereConditions.push('contact_id = ?');
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
          whereConditions.push(`cost_center_id IN (${numericIds.join(',')})`);
          
          // Não adiciona parâmetros já que os IDs estão diretamente na cláusula SQL
          console.log('Cláusula SQL para múltiplos centros:', `cost_center_id IN (${numericIds.join(',')})`);
        }
      } else {
        // Único centro de custo
        const costCenterId = parseInt(req.query.cost_center_id.toString(), 10);
        if (!isNaN(costCenterId)) {
          whereConditions.push('cost_center_id = ?');
          queryParams.push(costCenterId);
          console.log('Cláusula SQL para centro único:', 'cost_center_id = ?', costCenterId);
        }
      }
    } else if (userCostCenterId && (!req.query.cost_center_id || req.query.cost_center_id === '' || req.query.cost_center_id === 'all')) {
      console.log('Adding cost_center_id filter from user:', userCostCenterId);
      whereConditions.push('cost_center_id = ?');
      queryParams.push(userCostCenterId);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const query = `
      SELECT 
        SUM(amount) as total_amount,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_incomes,
        SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END) as total_investments,
        SUM(CASE WHEN payment_status_id = 2 THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN payment_status_id != 2 THEN amount ELSE 0 END) as total_unpaid,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as total_expense_transactions,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as total_income_transactions,
        COUNT(CASE WHEN type = 'investment' THEN 1 END) as total_investment_transactions,
        COUNT(CASE WHEN payment_status_id = 2 THEN 1 END) as total_paid_transactions,
        COUNT(CASE WHEN payment_status_id != 2 THEN 1 END) as total_unpaid_transactions
      FROM transactions
      ${whereClause}
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

    const stats = await get(db, query, queryParams);
    console.log('Transaction stats:', stats);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
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

    // Buscar os detalhes do pagamento
    const query = `
      SELECT 
        pd.*,
        ba.name as bank_account_name,
        c.name as card_name
      FROM payment_details pd
      LEFT JOIN bank_accounts ba ON pd.bank_account_id = ba.id
      LEFT JOIN cards c ON pd.card_id = c.id
      WHERE pd.transaction_id = ?
    `;

    const paymentDetails = await get(db, query, [transactionId]);

    if (!paymentDetails) {
      return res.status(404).json({ error: 'Payment details not found' });
    }

    res.json(paymentDetails);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  list,
  getById,
  create,
  update,
  patchTransaction,
  delete: deleteTransaction,
  markAsPaid,
  reversePayment,
  batchEdit,
  getTransactionStats,
  patch: patchTransaction,
  getPaymentDetails
};