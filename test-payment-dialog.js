// Teste específico para PaymentDialog
process.env.TZ = 'UTC';

// Função original que estava causando problemas
const formatDateToLocalOLD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Nova função corrigida
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

console.log('=== SIMULAÇÃO PAYMENTDIALOG EM UTC ===');

// Simular diferentes horários do dia em UTC
const times = [
  '2025-09-09T00:30:00Z', // Madrugada
  '2025-09-09T06:30:00Z', // Manhã
  '2025-09-09T12:30:00Z', // Meio-dia
  '2025-09-09T18:30:00Z', // Tarde
  '2025-09-09T23:30:00Z'  // Noite
];

times.forEach(timeStr => {
  const testDate = new Date(timeStr);
  console.log(`\nHorário: ${timeStr}`);
  console.log(`Data objeto: ${testDate}`);
  console.log(`Método ANTIGO: ${formatDateToLocalOLD(testDate)}`);
  console.log(`Método NOVO: ${formatDateToLocal(testDate)}`);
  console.log(`getTodayString se fosse agora: ${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`);
});

console.log('\n=== COMPARAÇÃO FINAL ===');
const now = new Date();
console.log('Data atual UTC:', now.toISOString());
console.log('formatDateToLocal(new Date()):', formatDateToLocal(new Date()));
console.log('getTodayString():', getTodayString());
