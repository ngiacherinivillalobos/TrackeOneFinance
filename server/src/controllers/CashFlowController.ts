import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

// Interface para o Cash Flow
interface CashFlow {
  id?: number;
  date: string;
  description: string;
  amount: number;
  record_type: 'Despesa' | 'Receita';
  category_id?: number;
  subcategory_id?: number;
  cost_center_id?: number;
  category_name?: string;
  subcategory_name?: string;
  cost_center_name?: string;
  cost_center_number?: string;
  created_at?: string;
  updated_at?: string;
}

export const CashFlowController = {
  // Listar todos os registros de cash flow
  getAll: async (req: Request, res: Response) => {
    try {
      const { db, all } = getDatabase();
      const { month, year } = req.query;
      const userCostCenterId = (req as any).user?.cost_center_id;
      
      console.log('Parâmetros recebidos:', { month, year, userCostCenterId, query: req.query });
      console.log('Tipo de month:', typeof month, 'Valor:', month);
      console.log('Tipo de year:', typeof year, 'Valor:', year);

      let query = `
        SELECT 
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
      `;
      
      console.log('Query base:', query);

      const params: any[] = [];
      const whereConditions: string[] = [];

      // Filtro por mês/ano se fornecido
      if (month && year) {
        console.log('Aplicando filtro de data');
        console.log('Valores originais - month:', month, 'year:', year);
        
        // Verificar se estamos em produção (PostgreSQL) ou desenvolvimento (SQLite)
        if (process.env.NODE_ENV === 'production') {
          console.log('Usando PostgreSQL');
          // PostgreSQL usa EXTRACT em vez de strftime
          whereConditions.push("EXTRACT(MONTH FROM cf.date) = ? AND EXTRACT(YEAR FROM cf.date) = ?");
          
          // Para PostgreSQL, usar valores inteiros
          const monthInt = parseInt(month.toString(), 10);
          const yearInt = parseInt(year.toString(), 10);
          params.push(monthInt, yearInt);
          console.log('Parâmetros PostgreSQL:', monthInt, yearInt);
        } else {
          console.log('Usando SQLite');
          // SQLite usa strftime
          whereConditions.push("strftime('%m', cf.date) = ? AND strftime('%Y', cf.date) = ?");
          
          // Para SQLite, precisamos usar os valores como strings formatadas
          // Padronizar month para garantir que seja no formato 'MM' (com dois dígitos)
          const monthInt = parseInt(month.toString(), 10);
          const monthStr = monthInt.toString().padStart(2, '0'); // Garante que mês tenha dois dígitos (ex: 09 em vez de 9)
          const yearStr = year.toString();
          
          params.push(monthStr, yearStr);
          console.log('Parâmetros SQLite:', monthStr, yearStr);
        }
        
        console.log('Filtro aplicado:', { 
          month, 
          year,
          dbType: process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'
        });
      } else {
        console.log('Nenhum filtro de data aplicado - month:', month, 'year:', year);
      }

      // Filtro por centro de custo do usuário
      console.log('Filtros de centro de custo:', {
        cost_center_id: req.query.cost_center_id,
        userCostCenterId: userCostCenterId,
        show_all_centers: req.query.show_all_centers
      });
      
      if (req.query.cost_center_id) {
        console.log('Filtro de cost_center_id fornecido:', req.query.cost_center_id);
        // Se o valor for 'all', não aplicar filtro de centro de custo
        if (req.query.cost_center_id === 'all') {
          // Mostrar todos os centros de custo
          console.log('Mostrando todos os centros de custo');
        } else {
          // Verificar se tem vírgula, indicando múltiplos valores
          if (req.query.cost_center_id.toString().includes(',')) {
            console.log('Múltiplos centros de custo detectados');
            // Múltiplos centros de custo separados por vírgula
            const costCenterIds = req.query.cost_center_id.toString().split(',').map(id => id.trim());
            
            // Converter IDs para números e filtrar valores inválidos
            const numericIds = costCenterIds
              .map(id => parseInt(id, 10))
              .filter(id => !isNaN(id));
            
            if (numericIds.length > 0) {
              // Construir cláusula IN diretamente na condição
              whereConditions.push(`cf.cost_center_id IN (${numericIds.join(',')})`);
              console.log('Filtro de múltiplos centros de custo:', numericIds);
            }
          } else {
            console.log('Único centro de custo detectado');
            // Único centro de custo
            const costCenterId = parseInt(req.query.cost_center_id.toString(), 10);
            if (!isNaN(costCenterId)) {
              whereConditions.push("cf.cost_center_id = ?");
              params.push(costCenterId);
              console.log('Filtro de centro de custo único:', costCenterId);
            }
          }
        }
      } else if (userCostCenterId && req.query.show_all_centers !== 'true') {
        console.log('Aplicando filtro de centro de custo do usuário');
        whereConditions.push("cf.cost_center_id = ?");
        params.push(userCostCenterId);
        console.log('Filtro de centro de custo do usuário:', userCostCenterId);
      } else {
        console.log('Nenhum filtro de centro de custo aplicado');
      }

      // Adicionar cláusula WHERE se houver condições
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
        console.log('Condições WHERE:', whereConditions);
      }

      query += ` ORDER BY cf.date DESC, cf.created_at DESC`;
      console.log('Query final:', query);
      console.log('Parâmetros:', params);
      console.log('Condições WHERE:', whereConditions);

      // Adicionar log para verificar a query final com parâmetros
      let finalQuery = query;
      params.forEach((param, index) => {
        // Substituir o primeiro ? pela posição do parâmetro
        finalQuery = finalQuery.replace('?', `'${param}'`);
      });
      console.log('Query final com parâmetros:', finalQuery);

      const rows = await all(db, query, params);
      console.log('Registros encontrados no banco:', rows.length);
      console.log('Registros retornados (detalhado):', rows.map(r => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: r.amount,
        record_type: r.record_type,
        amountType: typeof r.amount,
        amountValue: r.amount
      })));
      
      // Formatar as datas consistentemente entre ambientes
      const formattedRows = rows.map((row: any) => {
        // Log para verificar o tipo e valor do amount
        console.log('Processando registro:', {
          id: row.id,
          amount: row.amount,
          amountType: typeof row.amount,
          isNumber: typeof row.amount === 'number',
          isString: typeof row.amount === 'string'
        });
        
        // Se date for um objeto Date (PostgreSQL), converter para string no formato YYYY-MM-DD
        if (row.date instanceof Date) {
          // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
          const formattedDate = row.date.toISOString().split('T')[0];
          console.log('Formatando data (PostgreSQL):', { original: row.date, formatted: formattedDate });
          row.date = formattedDate;
        }
        // Se já estiver no formato string (SQLite), manter como está
        return row;
      });
      
      console.log('Registros formatados:', formattedRows.length);
      res.json(formattedRows);
    } catch (error) {
      console.error('Error in getAll cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
// Obter um registro específico
  getById: async (req: Request, res: Response) => {
    try {
      const { db, get } = getDatabase();
      const { id } = req.params;

      const query = `
        SELECT
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
        WHERE cf.id = ?
      `;

      const row = await get(db, query, [id]);
      if (!row) {
        return res.status(404).json({ error: 'Cash flow record not found' });
      }
      
      // Formatar a data consistentemente entre ambientes
      if (row.date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        row.date = row.date.toISOString().split('T')[0];
      }
      
      res.json(row);
    } catch (error) {
      console.error('Error in getById cash flow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Criar novo registro
  create: async (req: Request, res: Response) => {
    try {
      const { db, run, get } = getDatabase();
      const { date, description, amount, record_type, category_id, subcategory_id, cost_center_id }: CashFlow = req.body;
      const userCostCenterId = (req as any).user?.cost_center_id;

      // Validações básicas
      if (!date || !description || !amount || !record_type) {
        return res.status(400).json({ error: 'Required fields: date, description, amount, record_type' });
      }

      if (!['Despesa', 'Receita'].includes(record_type)) {
        return res.status(400).json({ error: 'record_type must be "Despesa" or "Receita"' });
      }

      // Garantir que sempre haja um centro de custo (do usuário se não for especificado)
      let effectiveCostCenterId = userCostCenterId;
      if (cost_center_id !== undefined && cost_center_id !== null && String(cost_center_id) !== '') {
        effectiveCostCenterId = Number(cost_center_id);
      }

      // Validar se o centro de custo é obrigatório
      if (!effectiveCostCenterId) {
        return res.status(400).json({ error: 'Centro de custo é obrigatório' });
      }

      const query = `
        INSERT INTO cash_flow (date, description, amount, record_type, category_id, subcategory_id, cost_center_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        date,
        description,
        amount,
        record_type,
        category_id || null,
        subcategory_id || null,
        effectiveCostCenterId
      ];

      const result: any = await run(db, query, params);
      
      // Retornar o registro criado
      const selectQuery = `
        SELECT
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
        WHERE cf.id = ?
      `;
      
      const createdRecord = await get(db, selectQuery, [result.lastID]);
      
      // Formatar a data consistentemente entre ambientes
      if (createdRecord && createdRecord.date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        createdRecord.date = createdRecord.date.toISOString().split('T')[0];
      }
      
      res.status(201).json(createdRecord);
    } catch (error) {
      console.error('Error creating cash flow record:', error);
      res.status(500).json({ error: 'Failed to create cash flow record' });
    }
  },

  // Atualizar registro
  update: async (req: Request, res: Response) => {
    try {
      const { db, get, run } = getDatabase();
      const { id } = req.params;
      const { date, description, amount, record_type, category_id, subcategory_id, cost_center_id }: Partial<CashFlow> = req.body;

      // Verificar se o registro existe
      const existingRecord = await get(db, 'SELECT id FROM cash_flow WHERE id = ?', [id]);
      if (!existingRecord) {
        return res.status(404).json({ error: 'Cash flow record not found' });
      }

      // Construir query de atualização dinamicamente
      const fields: string[] = [];
      const params: any[] = [];

      if (date !== undefined) {
        fields.push('date = ?');
        params.push(date);
      }
      if (description !== undefined) {
        fields.push('description = ?');
        params.push(description);
      }
      if (amount !== undefined) {
        fields.push('amount = ?');
        params.push(amount);
      }
      if (record_type !== undefined) {
        if (!['Despesa', 'Receita'].includes(record_type)) {
          return res.status(400).json({ error: 'record_type must be "Despesa" or "Receita"' });
        }
        fields.push('record_type = ?');
        params.push(record_type);
      }
      if (category_id !== undefined) {
        fields.push('category_id = ?');
        params.push(category_id || null);
      }
      if (subcategory_id !== undefined) {
        fields.push('subcategory_id = ?');
        params.push(subcategory_id || null);
      }
      if (cost_center_id !== undefined) {
        fields.push('cost_center_id = ?');
        params.push(cost_center_id || null);
      }

      // Sempre atualizar o campo updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length === 1) { // Apenas updated_at
        return res.status(400).json({ error: 'No fields to update' });
      }

      const query = `UPDATE cash_flow SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);

      await run(db, query, params);

      // Retornar o registro atualizado
      const selectQuery = `
        SELECT
          cf.id,
          cf.date,
          cf.description,
          cf.amount,
          cf.record_type,
          cf.category_id,
          cf.subcategory_id,
          cf.cost_center_id,
          c.name as category_name,
          sc.name as subcategory_name,
          cc.name as cost_center_name,
          cc.number as cost_center_number,
          cf.created_at,
          cf.updated_at
        FROM cash_flow cf
        LEFT JOIN categories c ON cf.category_id = c.id
        LEFT JOIN subcategories sc ON cf.subcategory_id = sc.id
        LEFT JOIN cost_centers cc ON cf.cost_center_id = cc.id
        WHERE cf.id = ?
      `;

      const updatedRecord = await get(db, selectQuery, [id]);
      
      // Formatar a data consistentemente entre ambientes
      if (updatedRecord && updatedRecord.date instanceof Date) {
        // Usar toISOString e extrair apenas a parte da data para evitar problemas de fuso horário
        updatedRecord.date = updatedRecord.date.toISOString().split('T')[0];
      }
      
      res.json(updatedRecord);
    } catch (error) {
      console.error('Error updating cash flow record:', error);
      res.status(500).json({ error: 'Failed to update cash flow record' });
    }
  },

  // Deletar registro
  delete: async (req: Request, res: Response) => {
    try {
      const { db, get, run } = getDatabase();
      const { id } = req.params;

      // Verificar se o registro existe
      const existingRecord = await get(db, 'SELECT id FROM cash_flow WHERE id = ?', [id]);
      if (!existingRecord) {
        return res.status(404).json({ error: 'Cash flow record not found' });
      }

      await run(db, 'DELETE FROM cash_flow WHERE id = ?', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting cash flow record:', error);
      res.status(500).json({ error: 'Failed to delete cash flow record' });
    }
  }
};