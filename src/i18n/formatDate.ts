/**
 * Locale-aware date formatting utility
 * 
 * Formats dates according to locale conventions:
 * - Croatian (hr): DD.MM.YYYY
 * - English (en): MM/DD/YYYY
 */

export type Locale = 'hr' | 'en';

/**
 * Format a date according to the specified locale
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting ('hr' or 'en')
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date('2023-12-25'), 'hr') // "25.12.2023"
 * formatDate(new Date('2023-12-25'), 'en') // "12/25/2023"
 */
export function formatDate(date: Date, locale: Locale): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return locale === 'hr' 
    ? `${day}.${month}.${year}`
    : `${month}/${day}/${year}`;
}
