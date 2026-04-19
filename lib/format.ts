export function formatLKR(value: number): string {
  const n = Math.round(value);
  return `Rs ${n.toLocaleString("en-LK")}`;
}

export function formatLKRCompact(value: number): string {
  if (value < 1000) return `Rs ${Math.round(value)}`;
  const thousands = Math.round(value / 1000);
  return `Rs ${thousands}k`;
}

export function effectivePrice(price: number, discountPct: number): number {
  if (!discountPct || discountPct <= 0) return price;
  return Math.round(price * (1 - discountPct / 100));
}

export function savingsAmount(price: number, discountPct: number): number {
  return price - effectivePrice(price, discountPct);
}
