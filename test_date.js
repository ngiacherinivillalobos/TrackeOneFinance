const testDate = '2025-09-10';
console.log('Data teste:', testDate);

// Simulando parseISO
const parsedDate = new Date(testDate + 'T00:00:00');
console.log('Date object:', parsedDate);
console.log('toISOString():', parsedDate.toISOString());
console.log('toISOString().split("T")[0]:', parsedDate.toISOString().split('T')[0]);

// formatDateToLocal function
const formatDateToLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

console.log('formatDateToLocal result:', formatDateToLocal(parsedDate));

// Teste com timezone
console.log('getTimezoneOffset():', parsedDate.getTimezoneOffset());
console.log('Date atual:', new Date());
console.log('Date atual toISOString():', new Date().toISOString());
console.log('Date atual toISOString().split("T")[0]:', new Date().toISOString().split('T')[0]);
