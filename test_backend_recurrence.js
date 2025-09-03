// Teste para verificar a correção da função de recorrência mensal no backend
function getNextMonthDate(currentDate) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  
  // Calcular o próximo mês
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }
  
  // Verificar se o dia existe no próximo mês
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const adjustedDay = Math.min(currentDay, daysInNextMonth);
  
  return new Date(nextYear, nextMonth, adjustedDay);
}

// Teste 1: Data de 31 de janeiro
console.log('Teste 1: 31/01/2025');
let testDate = new Date(2025, 0, 31); // 31 de janeiro de 2025
console.log('Data original:', testDate.toISOString().split('T')[0]);
let nextDate = getNextMonthDate(testDate);
console.log('Próximo mês:', nextDate.toISOString().split('T')[0]); // Deve ser 2025-02-28

// Teste 2: Data de 31 de março
console.log('\nTeste 2: 31/03/2025');
testDate = new Date(2025, 2, 31); // 31 de março de 2025
console.log('Data original:', testDate.toISOString().split('T')[0]);
nextDate = getNextMonthDate(testDate);
console.log('Próximo mês:', nextDate.toISOString().split('T')[0]); // Deve ser 2025-04-30

// Teste 3: Data de 29 de fevereiro em ano bissexto
console.log('\nTeste 3: 29/02/2024 (ano bissexto)');
testDate = new Date(2024, 1, 29); // 29 de fevereiro de 2024
console.log('Data original:', testDate.toISOString().split('T')[0]);
nextDate = getNextMonthDate(testDate);
console.log('Próximo mês:', nextDate.toISOString().split('T')[0]); // Deve ser 2024-03-29

// Teste 4: Sequência de meses a partir de 31/01/2025
console.log('\nTeste 4: Sequência de 6 meses a partir de 31/01/2025');
testDate = new Date(2025, 0, 31); // 31 de janeiro de 2025
console.log('Data original:', testDate.toISOString().split('T')[0]);

for (let i = 0; i < 6; i++) {
  nextDate = getNextMonthDate(testDate);
  console.log(`Mês ${i + 1}:`, nextDate.toISOString().split('T')[0]);
  testDate = nextDate;
}

console.log('\nTodos os testes de backend concluídos!');