// Simular ambiente UTC como produção
process.env.TZ = 'UTC';

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

console.log('=== TESTANDO EM AMBIENTE UTC ===');
console.log('Data atual:', new Date());
console.log('formatDateToLocal(new Date()):', formatDateToLocal(new Date()));
console.log('getTodayString():', getTodayString());
console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Testar com uma data específica que pode causar problemas
const testDate = new Date('2025-09-09T23:30:00Z'); // 23:30 UTC
console.log('\n=== TESTANDO COM DATA ESPECÍFICA ===');
console.log('Data de teste (23:30 UTC):', testDate);
console.log('formatDateToLocal(testDate):', formatDateToLocal(testDate));

// Testar diferenças entre métodos
console.log('\n=== COMPARANDO MÉTODOS ===');
const now = new Date();
console.log('now.toISOString().split("T")[0]:', now.toISOString().split('T')[0]);
console.log('formatDateToLocal(now):', formatDateToLocal(now));
console.log('Diferença?', now.toISOString().split('T')[0] === formatDateToLocal(now));
