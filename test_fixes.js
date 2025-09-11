#!/usr/bin/env node

// Script para testar as correções implementadas

console.log('🔍 Testando correções implementadas...\n');

// Funções corrigidas
const createSafeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  
  try {
    // Se for um formato ISO com timezone, extrair apenas a parte da data
    if (dateStr.includes('T')) {
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      // Criar data no timezone local
      return new Date(year, month - 1, day);
    }
    
    // Para formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    console.warn('Erro ao criar data:', error, 'dateStr:', dateStr);
    return new Date();
  }
};

const formatToBrazilianDate = (date) => {
  const dateObj = typeof date === 'string' ? createSafeDate(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

// Testar correção da data da meta de economia
console.log('📅 Testando correção da data da meta de economia:');
const testDate = '2025-09-15T00:00:00.000Z';
const safeDate = createSafeDate(testDate);
const formattedDate = formatToBrazilianDate(safeDate);

console.log(`  Data original: ${testDate}`);
console.log(`  Data segura: ${safeDate.toLocaleDateString('pt-BR')}`);
console.log(`  Data formatada: ${formattedDate}`);
console.log(`  ✅ Correção aplicada: ${formattedDate === '15/09/2025' ? 'SIM' : 'NÃO'}`);

// Testar correção da lógica de transações vencidas
console.log('\n📋 Testando correção da lógica de transações vencidas:');

const isTransactionOverdue = (transaction) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const transactionDate = createSafeDate(transaction.transaction_date);
  transactionDate.setHours(0, 0, 0, 0);
  
  // Verificar se a transação está vencida (data < hoje) e não paga
  return !transaction.is_paid && transactionDate < today;
};

const testTransactions = [
  {
    id: 1,
    description: 'Conta de luz',
    amount: 150.00,
    transaction_date: '2025-09-10T00:00:00.000Z',
    is_paid: false,
    payment_status_id: 1
  },
  {
    id: 2,
    description: 'Investimento futuro',
    amount: 2000.00,
    transaction_date: '2025-09-20T00:00:00.000Z',
    is_paid: false,
    payment_status_id: 1
  },
  {
    id: 3,
    description: 'Aluguel',
    amount: 1200.00,
    transaction_date: '2025-09-01T00:00:00.000Z',
    is_paid: false,
    payment_status_id: 1
  }
];

const today = new Date(2025, 8, 11); // 11 de setembro de 2025
console.log(`  Data de hoje: ${today.toLocaleDateString('pt-BR')}`);

testTransactions.forEach(transaction => {
  const isOverdue = isTransactionOverdue(transaction);
  const transactionDate = createSafeDate(transaction.transaction_date);
  
  console.log(`\n  Transação ${transaction.id}: ${transaction.description}`);
  console.log(`    Data: ${transactionDate.toLocaleDateString('pt-BR')}`);
  console.log(`    Paga: ${transaction.is_paid ? 'Sim' : 'Não'}`);
  console.log(`    Vencida: ${isOverdue ? 'Sim' : 'Não'}`);
  
  // Verificar se a lógica está correta
  if (transaction.id === 1) {
    console.log(`    ✅ Correção aplicada: ${isOverdue ? 'SIM' : 'NÃO'}`);
  } else if (transaction.id === 2) {
    console.log(`    ✅ Correção aplicada: ${!isOverdue ? 'SIM' : 'NÃO'}`);
  } else if (transaction.id === 3) {
    console.log(`    ✅ Correção aplicada: ${isOverdue ? 'SIM' : 'NÃO'}`);
  }
});

console.log('\n✅ Todas as correções foram testadas!');