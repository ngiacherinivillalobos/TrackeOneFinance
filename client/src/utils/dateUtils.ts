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