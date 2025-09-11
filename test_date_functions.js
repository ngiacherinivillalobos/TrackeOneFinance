// Script para testar as funções de data e verificar se há problemas com o timezone

console.log('🔍 Testando funções de data para verificar problemas de timezone...\n');

// Funções copiadas de dateUtils.ts
const createSafeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  
  try {
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida recebida:', dateStr);
        return new Date();
      }
      return date;
    }
    
    // For YYYY-MM-DD format, append time to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00');
    
    // Verifica se a data é válida
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

const formatToBrazilianDate = (date) => {
  const dateObj = typeof date === 'string' ? createSafeDate(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

const formatDateToLocal = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Data inválida recebida em formatDateToLocal:', date);
    // Criar uma nova data com horário meio-dia para evitar problemas de timezone
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

const getLocalDateString = () => {
  const now = new Date();
  // Forçar horário meio-dia para evitar problemas de timezone
  const safeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Testar diferentes formatos de data
const testDates = [
  '2025-09-15',
  '2025-09-15T00:00:00.000Z',
  '2025-09-15T12:00:00.000Z',
  '2025-09-15T23:59:59.000Z'
];

console.log('📅 Testando createSafeDate:');
testDates.forEach(dateStr => {
  try {
    const safeDate = createSafeDate(dateStr);
    const formatted = formatToBrazilianDate(safeDate);
    console.log(`  ${dateStr} -> ${safeDate.toISOString()} -> ${formatted}`);
  } catch (error) {
    console.log(`  ${dateStr} -> ERRO: ${error.message}`);
  }
});

console.log('\n📅 Testando formatDateToLocal:');
const testDate = new Date('2025-09-15T12:00:00.000Z');
console.log(`  Data de teste: ${testDate.toISOString()}`);
console.log(`  formatDateToLocal: ${formatDateToLocal(testDate)}`);

console.log('\n📅 Testando getLocalDateString:');
console.log(`  getLocalDateString: ${getLocalDateString()}`);

console.log('\n✅ Teste concluído!');