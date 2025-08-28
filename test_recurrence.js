// Teste da lógica de recorrência semanal
const transaction_date = "2025-08-25"; // Segunda-feira
const recurrence_type = "semanal";
const recurrence_weekday = "3"; // Quarta-feira (0=domingo, 3=quarta)
const recurrence_count = 4;

console.log('Testando recorrência semanal:');
console.log('Data original:', transaction_date, '(Segunda-feira)');
console.log('Dia da semana alvo:', recurrence_weekday, '(Quarta-feira)');
console.log('Quantidade:', recurrence_count);
console.log('---');

// Converter data
const dateParts = transaction_date.split('-').map(part => parseInt(part));
let startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // month is 0-indexed

console.log('Data inicial criada:', startDate.toISOString().split('T')[0]);
console.log('Dia da semana da data inicial:', startDate.getDay(), '(0=domingo, 1=segunda, etc.)');

// Para semanal, armazenar o dia da semana especificado
let targetWeekday = null;
if (recurrence_type === 'semanal' && recurrence_weekday) {
  targetWeekday = parseInt(recurrence_weekday);
}

console.log('Dia da semana alvo (número):', targetWeekday);
console.log('---');

const results = [];

for (let i = 0; i < recurrence_count; i++) {
  let currentDate;
  
  if (recurrence_type === 'semanal') {
    if (i === 0) {
      // Primeira transação: usar a data original do registro
      currentDate = new Date(startDate);
    } else {
      // Próximas transações: usar o dia da semana especificado
      if (targetWeekday !== null) {
        // Para a segunda transação e subsequentes, 
        // calcular a próxima ocorrência do dia da semana especificado
        if (i === 1) {
          // Segunda transação: encontrar a próxima ocorrência do dia alvo após a data inicial
          const currentWeekDay = startDate.getDay();
          let daysToAdd = (targetWeekday - currentWeekDay + 7) % 7;
          
          // Se o dia alvo é o mesmo dia da semana da data inicial, avançar uma semana
          if (daysToAdd === 0) {
            daysToAdd = 7;
          }
          
          currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + daysToAdd);
        } else {
          // Terceira transação em diante: avançar semanas a partir da segunda transação
          const secondTransactionWeekDay = startDate.getDay();
          let daysToSecondTransaction = (targetWeekday - secondTransactionWeekDay + 7) % 7;
          if (daysToSecondTransaction === 0) {
            daysToSecondTransaction = 7;
          }
          
          currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + daysToSecondTransaction + (7 * (i - 1)));
        }
        
        console.log(`Semana ${i}: result=${currentDate.toISOString().split('T')[0]}`);
      } else {
        // Se não tem dia da semana especificado, usar a lógica antiga
        currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (7 * i));
      }
    }
  }
  
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dateStr = currentDate.toISOString().split('T')[0];
  const dayOfWeek = currentDate.getDay();
  
  results.push({
    transacao: i + 1,
    data: dateStr,
    diaDaSemana: dayNames[dayOfWeek]
  });
  
  console.log(`Transação ${i + 1}: ${dateStr} (${dayNames[dayOfWeek]})`);
}

console.log('---');
console.log('Resultado esperado:');
console.log('- Transação 1: 2025-08-25 (Segunda-feira) - data original');
console.log('- Transação 2: 2025-08-27 (Quarta-feira) - primeira quarta após registro');
console.log('- Transação 3: 2025-09-03 (Quarta-feira) - segunda quarta');
console.log('- Transação 4: 2025-09-10 (Quarta-feira) - terceira quarta');
