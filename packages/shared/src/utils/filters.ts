/**
 * Filters an array of items by date range
 * @param data Array of items with a date property
 * @param start Start date string (ISO format)
 * @param end End date string (ISO format)
 * @returns Filtered array of items
 */
export function filterByDateRange<T extends { date: string }>(data: T[], start: string, end: string): T[] {
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(start) && itemDate <= new Date(end);
  });
}

/**
 * Groups an array of items by a specified key
 * @param array Array of items to group
 * @param key Function that returns the key to group by
 * @returns Object with keys and arrays of grouped items
 */
export function groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const group = key(item);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Calculates totals for a group of items
 * @param items Array of items with an amount property
 * @returns Total amount
 */
export function calculateTotal<T extends { amount: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Formats a date range for display
 * @param start Start date string
 * @param end End date string
 * @returns Formatted date range string
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
} 