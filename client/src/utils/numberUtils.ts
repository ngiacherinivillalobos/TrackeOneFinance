/**
 * Converte um valor em formato brasileiro para um número
 * @param str Valor em formato brasileiro (ex: "1.500,99")
 * @returns Valor numérico
 */
export const parseBrazilianNumber = (str: string | number): number => {
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
};

/**
 * Formata um número para o formato de moeda brasileira
 * @param value Valor numérico
 * @returns Valor formatado em moeda brasileira (ex: "R$ 1.500,99")
 */
export const formatToBrazilianCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um número para o formato brasileiro
 * @param value Valor numérico
 * @param decimals Número de casas decimais
 * @returns Valor formatado (ex: "1.500,99")
 */
export const formatToBrazilianNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};