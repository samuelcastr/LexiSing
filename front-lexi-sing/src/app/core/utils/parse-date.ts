export function parseDate(value: any): Date {
  if (!value) return new Date(0);
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date(0) : date;
  }
  if (value.seconds !== undefined) return new Date(value.seconds * 1000);
  if (value._seconds !== undefined) return new Date(value._seconds * 1000);
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !isNaN(date.getTime()) ? date : new Date(0);
  }
  return new Date(0);
}
