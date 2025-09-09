/**
 * Parse a date string in YYYY-MM-DD format to a Date object
 * This function ensures consistent parsing regardless of the database backend
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object
 */
export const parseDate = (dateStr: string): Date => {
  if (dateStr.includes('T')) {
    // ISO format - use directly
    return new Date(dateStr);
  } else {
    // YYYY-MM-DD format - create date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 because Date uses months 0-11
  }
};

/**
 * Format a date to Brazilian format (dd/MM/yyyy)
 * @param date Date object or date string
 * @returns Formatted date string
 */
export const formatToBrazilianDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Format a date to ISO format (YYYY-MM-DD) for database storage
 * @param date Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatToISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get current local date as YYYY-MM-DD string without timezone issues
 * This function prevents the d-1 bug in production environments
 * @returns Current local date in YYYY-MM-DD format
 */
export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a Date object to local YYYY-MM-DD string without timezone issues
 * This function prevents the d-1 bug in production environments
 * @param date Date object to format
 * @returns Date in YYYY-MM-DD format
 */
export const formatDateToLocal = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Data inválida recebida em formatDateToLocal:', date);
    return formatDateToLocal(new Date()); // fallback para data atual
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Create a safe date object from a date string to prevent timezone issues
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object
 */
export const createSafeDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  
  try {
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida recebida:', dateStr);
        return new Date();
      }
      return date;
    }
    
    // For YYYY-MM-DD format, append time to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00');
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida recebida:', dateStr);
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.warn('Erro ao criar data:', error, 'dateStr:', dateStr);
    return new Date();
  }
};