# BACKUP COMPLETO DA EVOLUÇÃO DO PROJETO - 19/09/2025

## ÍNDICE
1. [Informações Gerais do Projeto](#informações-gerais-do-projeto)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Principais Arquivos Modificados](#principais-arquivos-modificados)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Banco de Dados](#banco-de-dados)
6. [Frontend - Componentes Principais](#frontend---componentes-principais)
7. [Backend - Controladores e Rotas](#backend---controladores-e-rotas)
8. [Serviços e Utilitários](#serviços-e-utilitários)
9. [Configurações e Deploy](#configurações-e-deploy)
10. [Scripts de Manutenção](#scripts-de-manutenção)

---

## INFORMAÇÕES GERAIS DO PROJETO

**Nome do Projeto:** TrackeOne Finance
**Data do Backup:** 19/09/2025
**Versão:** 1.0.0
**Descrição:** Sistema de gerenciamento financeiro pessoal com controle de cartões de crédito, transações mensais e fluxo de caixa.

---

## ESTRUTURA DE DIRETÓRIOS

```
TrackeOneFinance/
├── client/                 # Aplicação frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   ├── lib/            # Bibliotecas e configurações
│   │   ├── theme/          # Temas e estilos
│   │   └── contexts/       # Contextos React
│   └── public/             # Arquivos públicos
├── server/                 # Aplicação backend Node.js/Express
│   ├── src/
│   │   ├── controllers/    # Controladores das rotas
│   │   ├── routes/         # Definição das rotas
│   │   ├── database/       # Conexão e migrações do banco
│   │   └── utils/          # Funções utilitárias
│   └── database/           # Arquivos de banco de dados
├── database/               # Scripts e migrações de banco
├── scripts/                # Scripts de automação
└── docs/                   # Documentação do projeto
```

---

## PRINCIPAIS ARQUIVOS MODIFICADOS

### Arquivos do Frontend (client/src/)

1. **pages/CreditCard.tsx** - Página principal de gerenciamento de cartões de crédito
2. **components/CreditCardTransactionForm.tsx** - Formulário de transações de cartão
3. **services/cardTransactionService.ts** - Serviço de transações de cartão
4. **services/transactionService.ts** - Serviço de transações mensais
5. **services/cardService.ts** - Serviço de cartões
6. **components/modern/ModernComponents.tsx** - Componentes modernos da interface

### Arquivos do Backend (server/src/)

1. **controllers/CreditCardTransactionController.ts** - Controlador de transações de cartão
2. **routes/creditCardTransactions.ts** - Rotas de transações de cartão
3. **database/connection.ts** - Conexão com o banco de dados
4. **database/migrations/** - Scripts de migração do banco

---

## FUNCIONALIDADES IMPLEMENTADAS

### 1. Gestão de Cartões de Crédito
- Cadastro e gerenciamento de cartões de crédito
- Visualização de fechamento e vencimento
- Totalizadores por cartão

### 2. Transações de Cartão de Crédito
- Criação de transações individuais
- Transações parceladas
- Opção de valor total ou por parcela
- Filtros avançados (período, categoria, subcategoria, cartão)

### 3. Ordenação e Interface
- Ordenação nas colunas da tabela
- Interface moderna com componentes reutilizáveis
- Layout responsivo

### 4. Edição em Lote
- Seleção múltipla de transações
- Edição em lote com layout padrão
- Exclusão em lote

### 5. Integração com Controle Mensal
- Criação automática de transações no controle mensal
- Sincronização de valores totais
- Cálculo automático de datas de vencimento

---

## BANCO DE DADOS

### Estrutura das Tabelas Principais

#### Tabela: credit_card_transactions
```sql
CREATE TABLE credit_card_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    category_id INTEGER,
    subcategory_id INTEGER,
    card_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER,
    total_installments INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

#### Tabela: transactions (controle mensal)
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER DEFAULT 1,
    contact_id INTEGER,
    cost_center_id INTEGER,
    bank_account_id INTEGER,
    card_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_type TEXT,
    recurrence_count INTEGER,
    recurrence_end_date DATE,
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER,
    total_installments INTEGER,
    is_paid BOOLEAN DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

---

## FRONTEND - COMPONENTES PRINCIPAIS

### CreditCard.tsx (Resumo das principais funcionalidades)

```typescript
// Estados principais
const [cards, setCards] = useState<CreditCard[]>([]);
const [transactions, setTransactions] = useState<CardTransaction[]>([]);
const [filters, setFilters] = useState<Filters>({
  month: new Date(),
  cardId: '',
  categoryId: [],
  subcategoryId: '',
});
const [orderBy, setOrderBy] = useState<string>('transaction_date');
const [order, setOrder] = useState<'asc' | 'desc'>('asc');

// Funções de ordenação
const handleSort = (property: string) => {
  const isAsc = orderBy === property && order === 'asc';
  setOrder(isAsc ? 'desc' : 'asc');
  setOrderBy(property);
};

// Função para criar transação automática no controle mensal
const createAutomaticTransaction = async (cardId: number, month: Date, totalAmount: number) => {
  try {
    // Obter informações do cartão para a data de vencimento
    const card = cards.find(c => c.id === cardId);
    if (!card) {
      console.error('Cartão não encontrado');
      return;
    }

    // Calcular a data de vencimento baseada no dia de vencimento do cartão
    const dueDate = new Date(month.getFullYear(), month.getMonth(), card.due_day || 10);
    
    // Dados para a transação automática
    const automaticTransactionData = {
      description: "Criação Automática de Fatura do Cartão de Crédito",
      amount: totalAmount,
      transaction_type: 'Despesa' as 'Despesa' | 'Receita' | 'Investimento',
      category_id: 1, // Categoria "Cartão de Crédito"
      transaction_date: dueDate.toISOString().split('T')[0],
      is_recurring: false,
      is_paid: false,
      payment_status_id: 1 // Em aberto
    };

    // Criar a transação automática
    await transactionService.create(automaticTransactionData);
    console.log('Transação automática criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar transação automática:', error);
  }
};
```

### CreditCardTransactionForm.tsx (Resumo das principais funcionalidades)

```typescript
// Interface do formulário
interface FormData {
  date: Date;
  description: string;
  amount: string;
  categoryId: string;
  subcategoryId: string;
  cardId: string;
  isInstallment: boolean;
  installments: number | '';
  amountType: 'parcela' | 'total';
}

// Função de submissão
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Converter dados para o formato da transação
    const parseBrazilianNumber = (str: string): number => {
      if (typeof str === 'number') return str;
      
      str = str.toString().trim();
      
      if (!str.includes(',')) {
        return parseFloat(str.replace(/\./g, '')) || 0;
      }
      
      const parts = str.split(',');
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1] || '00';
      
      const americanFormat = integerPart + '.' + decimalPart;
      return parseFloat(americanFormat) || 0;
    };
    
    let amount = parseBrazilianNumber(formData.amount);
    
    // Ajustar o valor com base no tipo selecionado
    if (formData.isInstallment && formData.installments !== undefined && formData.installments !== null) {
      let installments: number;
      if (formData.installments === '') {
        installments = 2;
      } else {
        installments = Number(formData.installments) || 2;
      }
      
      if (formData.amountType === 'total') {
        // Se for valor total, dividir pelo número de parcelas
        amount = amount / installments;
      }
    }
    
    // Determinar a data correta com base na data de fechamento do cartão
    let transactionDate = new Date(formData.date);
    const selectedCard = cards.find(card => card.id === parseInt(formData.cardId));
    
    if (selectedCard && selectedCard.closing_day) {
      const transactionDay = transactionDate.getDate();
      
      if (transactionDay >= selectedCard.closing_day) {
        transactionDate.setMonth(transactionDate.getMonth() + 1);
      }
    }

    if (transaction) {
      // Atualizar transação existente
      if (formData.isInstallment) {
        // Para transações parceladas, precisamos atualizar todas as parcelas
        const installmentData = {
          description: formData.description,
          amount: amount,
          type: 'expense',
          category_id: parseInt(formData.categoryId),
          subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          card_id: parseInt(formData.cardId),
          transaction_date: transactionDate.toISOString().split('T')[0],
          is_installment: true,
          total_installments: formData.installments === '' ? 2 : Number(formData.installments),
          installment_number: transaction.installment_number
        };

        await api.put(`/credit-card-transactions/${transaction.id}`, installmentData);
      } else {
        // Atualizar transação única
        const transactionData = {
          description: formData.description,
          amount: amount,
          type: 'expense',
          category_id: parseInt(formData.categoryId),
          subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          card_id: parseInt(formData.cardId),
          transaction_date: transactionDate.toISOString().split('T')[0],
          is_installment: false
        };

        await api.put(`/credit-card-transactions/${transaction.id}`, transactionData);
      }
    } else {
      // Criar nova transação
      if (formData.isInstallment) {
        // Criar transações parceladas usando o novo endpoint
        const installments = formData.installments === '' ? 2 : (typeof formData.installments === 'string' ? 2 : formData.installments);
        const installmentData = {
          description: formData.description,
          total_amount: formData.amountType === 'total' ? parseBrazilianNumber(formData.amount) : amount * installments,
          total_installments: installments,
          card_id: parseInt(formData.cardId),
          category_id: parseInt(formData.categoryId),
          subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          transaction_date: transactionDate.toISOString().split('T')[0]
        };

        await api.post('/credit-card-transactions/installments', installmentData);
      } else {
        // Criar transação única usando o novo endpoint
        const transactionData = {
          description: formData.description,
          amount: amount,
          type: 'expense',
          category_id: parseInt(formData.categoryId),
          subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          card_id: parseInt(formData.cardId),
          transaction_date: transactionDate.toISOString().split('T')[0]
        };

        await api.post('/credit-card-transactions', transactionData);
      }
    }

    onSubmit();
    onClose();
  } catch (err: any) {
    setError(err.response?.data?.error || 'Erro ao salvar transação');
  }
};
```

---

## BACKEND - CONTROLADORES E ROTAS

### CreditCardTransactionController.ts (Resumo das principais funcionalidades)

```typescript
// Função para listar transações
const list = async (req: Request, res: Response) => {
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
    
    if (req.query.start_date) {
      conditions.push('cct.transaction_date >= ?');
      values.push(req.query.start_date);
    }
    
    if (req.query.end_date) {
      conditions.push('cct.transaction_date <= ?');
      values.push(req.query.end_date);
    }
    
    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Ordenação
    query += ' ORDER BY cct.transaction_date DESC, cct.created_at DESC';
    
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

// Função para criar transações parceladas
const createInstallments = async (req: Request, res: Response) => {
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
    
    // Determinar a data correta com base na data de fechamento do cartão
    let adjustedTransactionDate = createSafeDate(transaction_date);
    
    if (card && card.closing_day) {
      const transactionDay = adjustedTransactionDate.getDate();
      
      if (transactionDay >= card.closing_day) {
        adjustedTransactionDate.setMonth(adjustedTransactionDate.getMonth() + 1);
      }
    }
    
    const adjustedTransactionDateString = adjustedTransactionDate.toISOString().split('T')[0];

    // Calcular valor de cada parcela
    const installmentAmount = parseFloat((total_amount / total_installments).toFixed(2));
    
    // Calcular diferença para ajustar na última parcela
    const totalCalculated = installmentAmount * (total_installments - 1);
    const lastInstallmentAmount = parseFloat((total_amount - totalCalculated).toFixed(2));

    const createdTransactions = [];
    
    // Criar todas as parcelas
    for (let i = 1; i <= total_installments; i++) {
      // Calcular data da parcela (adicionar meses)
      const installmentDate = createSafeDate(adjustedTransactionDateString);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
      
      const installmentDateString = installmentDate.toISOString().split('T')[0];
      
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
          is_installment,
          installment_number,
          total_installments,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const installmentDescription = `${description} (${i}/${total_installments})`;
      
      const result = await run(db, insertQuery, [
        installmentDescription,
        amount,
        'expense',
        category_id || null,
        subcategory_id || null,
        card_id,
        installmentDateString,
        toDatabaseBoolean(true),
        i,
        total_installments
      ]);
      
      // Buscar a transação criada
      const createdTransaction = await get(db, 'SELECT * FROM credit_card_transactions WHERE id = ?', [result.lastID]);
      createdTransactions.push(createdTransaction);
    }

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
```

---

## SERVIÇOS E UTILITÁRIOS

### cardTransactionService.ts
```typescript
export const cardTransactionService = {
  // Criar transações parceladas
  async createInstallments(data: CreateInstallmentsRequest): Promise<CreateInstallmentsResponse> {
    const response = await api.post('/credit-card-transactions/installments', data);
    return response.data;
  },

  // Listar transações de um cartão específico
  async getByCard(cardId: number): Promise<CardTransaction[]> {
    const response = await api.get(`/credit-card