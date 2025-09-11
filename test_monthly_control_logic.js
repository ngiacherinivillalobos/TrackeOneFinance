#!/usr/bin/env node

// Script para testar a lógica do MonthlyControl

console.log('🔍 Testando lógica do MonthlyControl...\n');

// Função para criar data segura
const createSafeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  
  try {
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      
      // Criar uma nova data com horário fixo (meio-dia) para evitar problemas de timezone
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const safeDate = new Date(year, month, day, 12, 0, 0);
      return safeDate;
    }
    
    // Para formato YYYY-MM-DD, adicionar horário fixo
    const date = new Date(dateStr + 'T12:00:00');
    
    if (isNaN(date.getTime())) {
      return new Date();
    }
    
    return date;
  } catch (error) {
    return new Date();
  }
};

// Função para verificar se uma transação está vencida
const isTransactionOverdue = (transaction) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const transactionDate = createSafeDate(transaction.transaction_date);
  transactionDate.setHours(0, 0, 0, 0);
  
  // Verificar se a transação está vencida (data < hoje) e não paga
  return !transaction.is_paid && transactionDate < today;
};

// Função para filtrar transações vencidas
const filterOverdueTransactions = (transactions, filters) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return transactions.filter((t) => {
    const transactionDate = createSafeDate(t.transaction_date);
    transactionDate.setHours(0, 0, 0, 0);
    
    // Verificar se a transação está vencida (data < hoje) e não paga
    const isOverdue = !t.is_paid && transactionDate < today;
    
    // Se não houver filtro de status, mostrar apenas vencidos não pagos
    if (filters.payment_status_id.length === 0) {
      return isOverdue;
    }
    
    // Se houver filtro de status, verificar se 'overdue' ou 'unpaid' estão nos filtros
    return (filters.payment_status_id.includes('overdue') || filters.payment_status_id.includes('unpaid')) && 
           !t.is_paid;
  });
};

// Dados de teste
const testTransactions = [
  {
    id: 1,
    description: 'Conta de luz',
    amount: 150.00,
    transaction_date: '2025-09-10',
    transaction_type: 'Despesa',
    is_paid: false,
    payment_status_id: 1
  },
  {
    id: 2,
    description: 'Salário',
    amount: 5000.00,
    transaction_date: '2025-09-05',
    transaction_type: 'Receita',
    is_paid: true,
    payment_status_id: 2
  },
  {
    id: 3,
    description: 'Aluguel',
    amount: 1200.00,
    transaction_date: '2025-09-01',
    transaction_type: 'Despesa',
    is_paid: false,
    payment_status_id: 1
  },
  {
    id: 4,
    description: 'Investimento',
    amount: 2000.00,
    transaction_date: '2025-09-20',
    transaction_type: 'Investimento',
    is_paid: false,
    payment_status_id: 1
  },
  {
    id: 5,
    description: 'Conta de água',
    amount: 80.00,
    transaction_date: '2025-09-08',
    transaction_type: 'Despesa',
    is_paid: false,
    payment_status_id: 1
  }
];

const testFilters = {
  payment_status_id: ['unpaid', 'overdue'],
  transaction_type: [],
  category_id: [],
  subcategory_id: '',
  contact_id: [],
  cost_center_id: []
};

console.log('📅 Data de hoje:', new Date().toLocaleDateString('pt-BR'));

// Filtrar transações vencidas
const overdueTransactions = filterOverdueTransactions(testTransactions, testFilters);

console.log('\n📋 Transações vencidas encontradas:');
overdueTransactions.forEach(transaction => {
  const transactionDate = createSafeDate(transaction.transaction_date);
  console.log(`  - ${transaction.description} (${transaction.transaction_type})`);
  console.log(`    Data: ${transactionDate.toLocaleDateString('pt-BR')}`);
  console.log(`    Valor: R$ ${transaction.amount.toFixed(2)}`);
  console.log(`    Paga: ${transaction.is_paid ? 'Sim' : 'Não'}`);
  console.log('');
});

console.log(`Total de transações vencidas: ${overdueTransactions.length}`);

// Testar combinação com transações do período
const currentDate = new Date(2025, 8, 11); // 11 de setembro de 2025
const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // 1º de setembro
const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // 30 de setembro

console.log(`\n📅 Período atual: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`);

// Filtrar transações do período
const periodTransactions = testTransactions.filter(transaction => {
  const transactionDate = createSafeDate(transaction.transaction_date);
  return transactionDate >= startDate && transactionDate <= endDate;
});

console.log('\n📋 Transações do período:');
periodTransactions.forEach(transaction => {
  const transactionDate = createSafeDate(transaction.transaction_date);
  console.log(`  - ${transaction.description} (${transaction.transaction_type})`);
  console.log(`    Data: ${transactionDate.toLocaleDateString('pt-BR')}`);
  console.log(`    Valor: R$ ${transaction.amount.toFixed(2)}`);
  console.log(`    Paga: ${transaction.is_paid ? 'Sim' : 'Não'}`);
  console.log(`    Vencida: ${isTransactionOverdue(transaction) ? 'Sim' : 'Não'}`);
  console.log('');
});

// Combinar transações vencidas com transações do período
const combinedTransactions = [...periodTransactions, ...overdueTransactions];
// Remover duplicatas
const uniqueTransactions = combinedTransactions.filter((transaction, index, self) => 
  index === self.findIndex(t => t.id === transaction.id)
);

console.log(`\n📊 Total de transações combinadas (únicas): ${uniqueTransactions.length}`);

console.log('\n✅ Teste concluído!');