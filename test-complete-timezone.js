// Teste AVANÇADO para detectar problemas de timezone
console.log('=== TESTE COMPLETO DE TIMEZONE ===');
console.log('Timezone do ambiente:', process.env.TZ || 'Local');

// Simular exatamente como o código funciona

// 1. Função getTodayString EXATA do código
const formatDateToLocal = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Data inválida recebida em formatDateToLocal:', date);
    const now = new Date();
    const safeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return formatDateToLocal(safeDate);
  }
  
  // Forçar horário meio-dia para evitar problemas de timezone em UTC
  const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayString = () => {
  const now = new Date();
  const safeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return formatDateToLocal(safeDate);
};

// 2. Simular em DIFERENTES AMBIENTES
console.log('\n=== TESTE 1: SIMULAÇÃO VERCEL UTC ===');
process.env.TZ = 'UTC';

const now = new Date();
console.log('new Date():', now.toString());
console.log('new Date().toISOString():', now.toISOString());
console.log('getTodayString():', getTodayString());
console.log('formatDateToLocal(new Date()):', formatDateToLocal(new Date()));

// 3. Testar função createSafeDate do SavingsGoalSettings
const createSafeDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Se é uma string de data (YYYY-MM-DD), criar com horário meio-dia
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    
    // Se é uma data ISO, usar Date constructor normal
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Forçar horário meio-dia para consistência
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao criar data:', error);
    return null;
  }
};

console.log('\n=== TESTE 2: SAVINGS GOAL DATE HANDLING ===');
const testDates = [
  '2025-09-09',
  '2025-09-09T00:00:00Z',
  '2025-09-09T12:00:00Z',
  '2025-09-09T23:59:59Z'
];

testDates.forEach(dateStr => {
  console.log(`\nTesting: ${dateStr}`);
  const safeDate = createSafeDate(dateStr);
  console.log('createSafeDate:', safeDate ? safeDate.toString() : 'null');
  if (safeDate) {
    console.log('formatDateToLocal:', formatDateToLocal(safeDate));
  }
});

console.log('\n=== TESTE 3: PAYMENTDIALOG FIELD VALUES ===');
// Simular exatamente o que PaymentDialog faz na inicialização
const paymentDialogInitialDate = getTodayString();
console.log('PaymentDialog payment_date field value:', paymentDialogInitialDate);

// Simular input type="date" behavior
console.log('HTML input[type="date"] seria:', paymentDialogInitialDate);

console.log('\n=== TESTE 4: COMPARAÇÃO BRASIL vs UTC ===');
// Simular como seria no Brasil (UTC-3)
process.env.TZ = 'America/Sao_Paulo';
console.log('São Paulo getTodayString():', getTodayString());

// Voltar para UTC
process.env.TZ = 'UTC';
console.log('UTC getTodayString():', getTodayString());

console.log('\n=== ANÁLISE FINAL ===');
console.log('Se aparecer data D-1 no frontend, o problema NÃO está nas funções.');
console.log('Possíveis causas:');
console.log('1. Cache do navegador');
console.log('2. Bundle antigo no Vercel');
console.log('3. Problema no HTML input type="date"');
console.log('4. Estado do React não atualizando');
