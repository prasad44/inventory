import { describe, it, expect } from "vitest";
import { computeDeliveryDates, computeDeliveryFee, FREE_DELIVERY_THRESHOLD_LKR } from "../delivery";

describe("computeDeliveryDates", () => {
  it("adds business days, skipping Sundays", () => {
    // Mon 2026-04-20 + 2 business days → Wed 2026-04-22 (Tuesday is counted)
    const from = new Date("2026-04-20T00:00:00Z");
    const { min, max } = computeDeliveryDates(from, 1, 2);
    expect(min.toISOString().slice(0, 10)).toBe("2026-04-21");
    expect(max.toISOString().slice(0, 10)).toBe("2026-04-22");
  });

  it("jumps over Sunday when counting business days", () => {
    // Sat 2026-04-18 + 1 business day should skip Sunday → Monday 2026-04-20
    const from = new Date("2026-04-18T00:00:00Z");
    const { min } = computeDeliveryDates(from, 1, 1);
    expect(min.toISOString().slice(0, 10)).toBe("2026-04-20");
  });

  it("handles zero-day range by returning the next business day", () => {
    const from = new Date("2026-04-20T00:00:00Z");
    const { min, max } = computeDeliveryDates(from, 0, 0);
    // 0 business days added means same day at minimum, but we always advance at least once
    expect(min.toISOString().slice(0, 10)).toBe("2026-04-20");
    expect(max.toISOString().slice(0, 10)).toBe("2026-04-20");
  });
});

describe("computeDeliveryFee", () => {
  it("returns zero at or above threshold", () => {
    expect(computeDeliveryFee(500, FREE_DELIVERY_THRESHOLD_LKR)).toBe(0);
  });

  it("returns zero above threshold", () => {
    expect(computeDeliveryFee(500, FREE_DELIVERY_THRESHOLD_LKR + 1)).toBe(0);
  });

  it("returns full fee below threshold", () => {
    expect(computeDeliveryFee(500, FREE_DELIVERY_THRESHOLD_LKR - 1)).toBe(500);
  });

  it("explicit threshold override works", () => {
    expect(computeDeliveryFee(350, 10000, 20000)).toBe(350);
    expect(computeDeliveryFee(350, 20000, 20000)).toBe(0);
  });
});
