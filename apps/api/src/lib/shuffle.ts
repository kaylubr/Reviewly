export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const other = copy[swapWith];

    if (current === undefined || other === undefined) {
      continue;
    }

    copy[index] = other;
    copy[swapWith] = current;
  }

  return copy;
}
