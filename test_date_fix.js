// Teste para verificar a correção da função addMonths
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

// Teste 1: Data de 31 de janeiro para meses sem 31 dias
console.log('Teste 1: 31/01 para fevereiro (deve ser 28 ou 29 dependendo do ano bissexto)');
console.log('31/01/2025 + 1 mês:', addMonths('2025-01-31', 1)); // Deve ser 2025-02-28
console.log('31/01/2024 + 1 mês:', addMonths('2024-01-31', 1)); // Deve ser 2024-02-29 (ano bissexto)

// Teste 2: Data de 31 de março para meses sem 31 dias
console.log('\nTeste 2: 31/03 para abril (deve ser 30)');
console.log('31/03/2025 + 1 mês:', addMonths('2025-03-31', 1)); // Deve ser 2025-04-30

// Teste 3: Data de 31 de maio para meses sem 31 dias
console.log('\nTeste 3: 31/05 para junho (deve ser 30)');
console.log('31/05/2025 + 1 mês:', addMonths('2025-05-31', 1)); // Deve ser 2025-06-30

// Teste 4: Data de 31 de julho para meses sem 31 dias
console.log('\nTeste 4: 31/07 para agosto (deve ser 31)');
console.log('31/07/2025 + 1 mês:', addMonths('2025-07-31', 1)); // Deve ser 2025-08-31

// Teste 5: Data de 31 de agosto para meses sem 31 dias
console.log('\nTeste 5: 31/08 para setembro (deve ser 30)');
console.log('31/08/2025 + 1 mês:', addMonths('2025-08-31', 1)); // Deve ser 2025-09-30

// Teste 6: Data de 31 de outubro para meses sem 31 dias
console.log('\nTeste 6: 31/10 para novembro (deve ser 30)');
console.log('31/10/2025 + 1 mês:', addMonths('2025-10-31', 1)); // Deve ser 2025-11-30

// Teste 7: Data de 31 de dezembro para janeiro do próximo ano
console.log('\nTeste 7: 31/12 para janeiro do próximo ano (deve ser 31)');
console.log('31/12/2025 + 1 mês:', addMonths('2025-12-31', 1)); // Deve ser 2026-01-31

console.log('\nTodos os testes concluídos!');