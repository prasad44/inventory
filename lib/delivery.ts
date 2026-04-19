export const FREE_DELIVERY_THRESHOLD_LKR = 5000;

export interface DeliveryWindow {
  min: Date;
  max: Date;
}

export function computeDeliveryDates(from: Date, minDays: number, maxDays: number): DeliveryWindow {
  return {
    min: addBusinessDays(from, minDays),
    max: addBusinessDays(from, maxDays),
  };
}

function addBusinessDays(start: Date, days: number): Date {
  const r = new Date(start);
  if (days <= 0) {
    // At least return the start date itself (or next Mon if start is a Sunday)
    if (r.getUTCDay() === 0) r.setUTCDate(r.getUTCDate() + 1);
    return r;
  }
  let added = 0;
  while (added < days) {
    r.setUTCDate(r.getUTCDate() + 1);
    if (r.getUTCDay() !== 0) added++;
  }
  return r;
}

export function computeDeliveryFee(
  fee: number,
  subtotal: number,
  threshold: number = FREE_DELIVERY_THRESHOLD_LKR
): number {
  return subtotal >= threshold ? 0 : fee;
}
