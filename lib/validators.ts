export function validateCategory(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("Name is required");
  }
  return errors;
}

export function validateSupplier(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("Name is required");
  }
  if (data.email && typeof data.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }
  return errors;
}

export function validateProduct(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("Name is required");
  }
  if (!data.sku || typeof data.sku !== "string" || data.sku.trim().length === 0) {
    errors.push("SKU is required");
  }
  if (data.price !== undefined && (typeof data.price !== "number" || data.price < 0)) {
    errors.push("Price must be a non-negative number");
  }
  if (data.cost_price !== undefined && (typeof data.cost_price !== "number" || data.cost_price < 0)) {
    errors.push("Cost price must be a non-negative number");
  }
  if (data.reorder_point !== undefined && (typeof data.reorder_point !== "number" || data.reorder_point < 0)) {
    errors.push("Reorder point must be a non-negative number");
  }
  return errors;
}

export function validateOrder(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (!data.type || !["inbound", "outbound", "adjustment"].includes(data.type as string)) {
    errors.push("Type must be inbound, outbound, or adjustment");
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one item is required");
  }
  return errors;
}
