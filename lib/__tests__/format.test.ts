import { describe, it, expect } from "vitest";
import { formatLKR, formatLKRCompact, effectivePrice, savingsAmount } from "../format";

describe("formatLKR", () => {
  it("formats whole rupees with thousand separators", () => {
    expect(formatLKR(24990)).toBe("Rs 24,990");
  });
  it("formats small amounts", () => {
    expect(formatLKR(499)).toBe("Rs 499");
  });
  it("accepts decimals and rounds to whole rupees", () => {
    expect(formatLKR(1234.56)).toBe("Rs 1,235");
  });
});

describe("formatLKRCompact", () => {
  it("abbreviates thousands with k", () => {
    expect(formatLKRCompact(24990)).toBe("Rs 25k");
  });
  it("preserves small values", () => {
    expect(formatLKRCompact(499)).toBe("Rs 499");
  });
});

describe("effectivePrice", () => {
  it("applies percentage discount", () => {
    expect(effectivePrice(10000, 20)).toBe(8000);
  });
  it("returns original when no discount", () => {
    expect(effectivePrice(10000, 0)).toBe(10000);
  });
  it("handles negative discount defensively", () => {
    expect(effectivePrice(10000, -5)).toBe(10000);
  });
});

describe("savingsAmount", () => {
  it("computes difference between original and effective", () => {
    expect(savingsAmount(10000, 20)).toBe(2000);
  });
  it("returns zero when no discount", () => {
    expect(savingsAmount(10000, 0)).toBe(0);
  });
});
