/**
 * Data transformation utilities
 */

/**
 * Create a lookup map from an array of objects
 */
export const createLookupMap = <T, K extends keyof T, V extends keyof T>(
  items: T[],
  keyField: K,
  valueField: V
): Map<T[K], T[V]> => {
  return new Map(items.map((item) => [item[keyField], item[valueField]]));
};

/**
 * Create a full object lookup map from an array
 */
export const createObjectMap = <T, K extends keyof T>(
  items: T[],
  keyField: K
): Map<T[K], T> => {
  return new Map(items.map((item) => [item[keyField], item]));
};

/**
 * Group items by a specific field
 */
export const groupBy = <T, K extends keyof T>(
  items: T[],
  keyField: K
): Map<T[K], T[]> => {
  const map = new Map<T[K], T[]>();
  items.forEach((item) => {
    const key = item[keyField];
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  });
  return map;
};

/**
 * Sort array by date field (descending by default)
 */
export const sortByDate = <T>(
  items: T[],
  dateField: keyof T,
  ascending = false
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = String(a[dateField] || "");
    const dateB = String(b[dateField] || "");
    return ascending
      ? dateA.localeCompare(dateB)
      : dateB.localeCompare(dateA);
  });
};

/**
 * Sort array by numeric field
 */
export const sortByNumber = <T>(
  items: T[],
  numberField: keyof T,
  ascending = false
): T[] => {
  return [...items].sort((a, b) => {
    const numA = Number(a[numberField] || 0);
    const numB = Number(b[numberField] || 0);
    return ascending ? numA - numB : numB - numA;
  });
};

/**
 * Calculate sum of a numeric field in an array
 */
export const sumBy = <T>(items: T[], field: keyof T): number => {
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * Count items by a specific field value
 */
export const countBy = <T, K extends keyof T>(
  items: T[],
  field: K,
  value: T[K]
): number => {
  return items.filter((item) => item[field] === value).length;
};
