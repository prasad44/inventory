import { describe, it, expect } from "vitest";
import { computeSolarSavings } from "../solar";

describe("computeSolarSavings", () => {
  it("computes daily kWh saved, annual savings, and payback months", () => {
    // 60W × 6h = 360 Wh = 0.36 kWh/day
    // Annual: 0.36 × 365 × Rs 35 = Rs 4,599
    // Monthly: Rs 383.25 → payback of Rs 5990 product: ceil(5990 / 383.25) = 16
    const r = computeSolarSavings({
      hoursPerDay: 6,
      replacedWatts: 60,
      rateLKR: 35,
      productPriceLKR: 5990,
    });
    expect(r.dailyKWh).toBeCloseTo(0.36, 2);
    expect(r.annualSavings).toBe(4599);
    expect(r.paybackMonths).toBe(16);
  });

  it("returns Infinity payback when annual savings is zero", () => {
    const r = computeSolarSavings({
      hoursPerDay: 0,
      replacedWatts: 60,
      rateLKR: 35,
      productPriceLKR: 5990,
    });
    expect(r.annualSavings).toBe(0);
    expect(r.paybackMonths).toBe(Infinity);
  });

  it("handles zero product price (trivially recovers)", () => {
    const r = computeSolarSavings({
      hoursPerDay: 6,
      replacedWatts: 60,
      rateLKR: 35,
      productPriceLKR: 0,
    });
    expect(r.paybackMonths).toBe(0);
  });
});
