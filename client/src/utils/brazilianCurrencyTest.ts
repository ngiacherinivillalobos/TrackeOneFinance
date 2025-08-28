// Brazilian Currency Formatting Test Cases
// Created to verify the fix for the monetary value input issue

/**
 * Test cases for Brazilian currency formatting
 * 
 * Problem: When entering values like "1.666,00", the system was incorrectly 
 * parsing it as 1.666 instead of 1666.00
 * 
 * Solution: Created a robust parseBrazilianNumber function that correctly
 * handles Brazilian number formatting (dots for thousands, comma for decimals)
 */

function parseBrazilianNumber(str: string): number {
  if (typeof str === 'number') return str;
  
  str = str.toString().trim();
  
  // Se não tem vírgula, trata como número inteiro
  if (!str.includes(',')) {
    // Remove pontos (milhares) e converte
    return parseFloat(str.replace(/\./g, '')) || 0;
  }
  
  // Divide em parte inteira e decimal
  const parts = str.split(',');
  const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
  const decimalPart = parts[1] || '00'; // Parte decimal
  
  // Reconstrói o número no formato americano
  const americanFormat = integerPart + '.' + decimalPart;
  return parseFloat(americanFormat) || 0;
}

// Test cases
const testCases = [
  // Original problem case
  { input: "1.666,00", expected: 1666.00, description: "Thousands with decimal" },
  { input: "1666,00", expected: 1666.00, description: "No thousands separator with decimal" },
  { input: "1666", expected: 1666, description: "Integer only" },
  { input: "1.666", expected: 1666, description: "Thousands separator only" },
  { input: "10.000,50", expected: 10000.50, description: "Large number with decimal" },
  { input: "999.999.999,99", expected: 999999999.99, description: "Very large number" },
  { input: "0,50", expected: 0.50, description: "Decimal only" },
  { input: "123,45", expected: 123.45, description: "Small decimal" },
  { input: "1.000", expected: 1000, description: "Round thousands" },
  { input: "5.000.000", expected: 5000000, description: "Millions" },
];

console.log("=== Brazilian Currency Formatting Tests ===");
testCases.forEach((test, index) => {
  const result = parseBrazilianNumber(test.input);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'} ${test.description}`);
  console.log(`  Input: "${test.input}" → Expected: ${test.expected} → Got: ${result}`);
  if (!passed) {
    console.log(`  ❌ FAILED!`);
  }
});

export { parseBrazilianNumber };