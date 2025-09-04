// Funções utilitárias para tratamento de valores booleanos de forma consistente entre SQLite e PostgreSQL

/**
 * Converte um valor para booleano de forma consistente
 * @param value O valor a ser convertido
 * @returns 1 para verdadeiro, 0 para falso
 */
export const toBooleanInt = (value: any): number => {
  if (value === true || value === 1 || value === 'true' || value === '1') {
    return 1;
  }
  if (value === false || value === 0 || value === 'false' || value === '0' || value === null || value === undefined) {
    return 0;
  }
  // Para qualquer outro valor, considerar como falso
  return 0;
};

/**
 * Converte um valor para booleano padrão
 * @param value O valor a ser convertido
 * @returns true para verdadeiro, false para falso
 */
export const toBoolean = (value: any): boolean => {
  if (value === true || value === 1 || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 0 || value === 'false' || value === '0' || value === null || value === undefined) {
    return false;
  }
  // Para qualquer outro valor, considerar como falso
  return false;
};

/**
 * Converte um valor booleano para o formato do banco de dados
 * @param value O valor a ser convertido
 * @param isProduction Se está em ambiente de produção (PostgreSQL)
 * @returns Valor formatado para o banco de dados específico
 */
export const toDatabaseBoolean = (value: any, isProduction: boolean = false): any => {
  const boolValue = toBoolean(value);
  
  if (isProduction) {
    // PostgreSQL usa true/false
    return boolValue;
  } else {
    // SQLite usa 1/0
    return boolValue ? 1 : 0;
  }
};

export default {
  toBooleanInt,
  toBoolean,
  toDatabaseBoolean
};