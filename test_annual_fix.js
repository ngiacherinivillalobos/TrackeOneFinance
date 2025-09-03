// Teste para verificar a correção da função anual
const testAnnual = (dateStr, years) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  let newYear = year + years;
  
  // Verificar se o dia existe no novo ano/mês (para 29 de fevereiro em anos não bissextos)
  const daysInMonth = new Date(newYear, month, 0).getDate();
  const newDay = Math.min(day, daysInMonth);
  
  return newYear + '-' + String(month).padStart(2, '0') + '-' + String(newDay).padStart(2, '0');
};

// Teste 1: Data de 29 de fevereiro em ano bissexto para ano não bissexto
console.log('Teste 1: 29/02/2024 (ano bissexto) para 2025 (não bissexto)');
console.log('29/02/2024 + 1 ano:', testAnnual('2024-02-29', 1)); // Deve ser 2025-02-28

// Teste 2: Data de 29 de fevereiro em ano bissexto para outro ano bissexto
console.log('\nTeste 2: 29/02/2024 (ano bissexto) para 2028 (ano bissexto)');
console.log('29/02/2024 + 4 anos:', testAnnual('2024-02-29', 4)); // Deve ser 2028-02-29

// Teste 3: Data normal
console.log('\nTeste 3: 15/06/2025 + 1 ano');
console.log('15/06/2025 + 1 ano:', testAnnual('2025-06-15', 1)); // Deve ser 2026-06-15

console.log('\nTodos os testes anuais concluídos!');