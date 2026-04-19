export interface CartMergeItem {
  product_id: string;
  quantity: number;
}

/**
 * Merge a guest cart into an authenticated user cart.
 * Quantities for the same product are summed, then clamped to stock.
 * Products missing from the stock map (or with stock 0) are dropped.
 */
export function mergeCarts(
  guestItems: CartMergeItem[],
  userItems: CartMergeItem[],
  stockById: Map<string, number>
): CartMergeItem[] {
  const sums = new Map<string, number>();
  for (const it of userItems) {
    sums.set(it.product_id, (sums.get(it.product_id) ?? 0) + it.quantity);
  }
  for (const it of guestItems) {
    sums.set(it.product_id, (sums.get(it.product_id) ?? 0) + it.quantity);
  }

  const out: CartMergeItem[] = [];
  for (const [pid, qty] of sums) {
    const stock = stockById.get(pid) ?? 0;
    if (stock <= 0) continue;
    out.push({ product_id: pid, quantity: Math.min(qty, stock) });
  }
  return out;
}
