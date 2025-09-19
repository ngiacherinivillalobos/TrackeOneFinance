/**
 * Formata números para exibição na calculadora
 * - Mantém até 5 casas decimais
 * - Usa vírgula como separador decimal
 * - Usa ponto como separador de milhares
 * @param value Número a ser formatado
 * @param maxDecimals Número máximo de casas decimais (padrão: 5)
 * @returns String formatada
 */
export const formatCalculatorNumber = (value: number, maxDecimals: number = 5): string => {
  // Arredondar para o número máximo de casas decimais especificado
  const rounded = Math.round(value * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  
  // Remover zeros à direita após a vírgula, mantendo pelo menos um dígito
  const formatted = rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  });
  
  return formatted;
};

/**
 * Formata valores monetários para exibição
 * - Sempre mostra 2 casas decimais
 * - Usa vírgula como separador decimal
 * - Usa ponto como separador de milhares
 * @param value Valor a ser formatado
 * @returns String formatada como moeda
 */
export const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Parse de string formatada para número
 * - Converte vírgula para ponto
 * @param value String a ser convertida
 * @returns Número convertido
 */
export const parseFormattedNumber = (value: string): number => {
  // Substituir vírgula por ponto para parsing
  const normalized = value.replace(',', '.');
  return parseFloat(normalized);
};