// Teste para verificar se as correções estão funcionando
const addMonths = (dateStr, months) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  let newYear = year;
  let newMonth = month + months;
  
  // Ajustar ano e mês
  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }
  
  // Verificar se o dia existe no novo mês
  const daysInMonth = new Date(newYear, newMonth, 0).getDate();
  let newDay = day;
  
  // Se o dia não existe no novo mês, ajustar para o último dia do mês
  // Mas respeitando a regra: se for dia 31 e o mês não tem 31, usar o dia anterior (30)
  // e não o próximo (01 do próximo mês)
  if (newDay > daysInMonth) {
    newDay = daysInMonth;
  }
  
  return newYear + '-' + String(newMonth).padStart(2, '0') + '-' + String(newDay).padStart(2, '0');
};

console.log('Testando correção de datas:');
console.log('31/01/2025 + 1 mês:', addMonths('2025-01-31', 1)); // Deve ser 2025-02-28
console.log('31/03/2025 + 1 mês:', addMonths('2025-03-31', 1)); // Deve ser 2025-04-30
console.log('31/05/2025 + 1 mês:', addMonths('2025-05-31', 1)); // Deve ser 2025-06-30