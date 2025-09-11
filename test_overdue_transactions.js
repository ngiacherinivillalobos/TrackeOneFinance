#!/usr/bin/env node

// Script para testar a lógica de transações vencidas

console.log('🔍 Testando lógica de transações vencidas...\n');

// Função para criar data segura (simulando createSafeDate)
const createSafeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  
  try {
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Data inválida recebida:', dateStr);
        return new Date();
      }
      
      // Para evitar o problema d-1, vamos extrair a data no formato local
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // Criar uma nova data com horário fixo (meio-dia) para evitar problemas de timezone
      const safeDate = new Date(year, month, day, 12, 0, 0);
      return safeDate;
    }
    
    // Para formato YYYY-MM-DD, adicionar horário fixo
    const date = new Date(dateStr + 'T12:00:00');
    
    if (isNaN(date.getTime())) {
      console.warn('Data inválida recebida:', dateStr);
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.warn('Erro ao criar data:', error, 'dateStr:', dateStr);
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

// Dados de teste
const testTransactions = [
  {
    id: 1,
    description: 'Conta de luz',
    amount: 150.00,
    transaction_date: '2025-09-10',
    is_paid: false,
    payment_status_id: 1 // Em aberto
  },
  {
    id: 2,
    description: 'Salário',
    amount: 5000.00,
    transaction_date: '2025-09-05',
    is_paid: true,
    payment_status_id: 2 // Pago
  },
  {
    id: 3,
    description: 'Aluguel',
    amount: 1200.00,
    transaction_date: '2025-09-01',
    is_paid: false,
    payment_status_id: 1 // Em aberto
  },
  {
    id: 4,
    description: 'Investimento',
    amount: 2000.00,
    transaction_date: '2025-09-20',
    is_paid: false,
    payment_status_id: 1 // Em aberto
  }
];

console.log('📅 Data de hoje:', new Date().toLocaleDateString('pt-BR'));
console.log('\n📋 Verificando transações vencidas:');

testTransactions.forEach(transaction => {
  const isOverdue = isTransactionOverdue(transaction);
  const transactionDate = createSafeDate(transaction.transaction_date);
  
  console.log(`\n  Transação ${transaction.id}: ${transaction.description}`);
  console.log(`    Data: ${transactionDate.toLocaleDateString('pt-BR')}`);
  console.log(`    Paga: ${transaction.is_paid ? 'Sim' : 'Não'}`);
  console.log(`    Status ID: ${transaction.payment_status_id}`);
  console.log(`    Vencida: ${isOverdue ? 'Sim' : 'Não'}`);
});

console.log('\n✅ Teste concluído!');