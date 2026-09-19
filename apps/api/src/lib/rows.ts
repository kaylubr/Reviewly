export function first<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) {
    throw new Error('Expected the query to return at least one row');
  }
  return row;
}
