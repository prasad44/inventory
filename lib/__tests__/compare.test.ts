import { describe, it, expect } from "vitest";
import { computeSpecRows, bestValueMap, formatSpecKey, formatSpecValue } from "../compare";

describe("computeSpecRows", () => {
  it("returns union of keys across products, sorted", () => {
    const products = [
      { specs: { a: 1, b: 2 } },
      { specs: { b: 3, c: 4 } },
    ];
    expect(computeSpecRows(products).sort()).toEqual(["a", "b", "c"]);
  });

  it("skips calculator_* keys (internal)", () => {
    const products = [{ specs: { a: 1, calculator_meta: { x: 1 } } }];
    expect(computeSpecRows(products)).toEqual(["a"]);
  });

  it("returns empty array when products have no specs", () => {
    expect(computeSpecRows([{}, { specs: {} }])).toEqual([]);
  });
});

describe("bestValueMap", () => {
  it("marks highest value as best for 'max' direction", () => {
    const rows = [
      { id: "x", value: 10 },
      { id: "y", value: 20 },
      { id: "z", value: 15 },
    ];
    expect(bestValueMap(rows, "max")).toEqual({ y: true });
  });

  it("marks lowest value as best for 'min' direction", () => {
    const rows = [
      { id: "x", value: 10 },
      { id: "y", value: 20 },
      { id: "z", value: 5 },
    ];
    expect(bestValueMap(rows, "min")).toEqual({ z: true });
  });

  it("handles ties — marks all tied winners", () => {
    const rows = [
      { id: "x", value: 10 },
      { id: "y", value: 10 },
      { id: "z", value: 5 },
    ];
    expect(bestValueMap(rows, "max")).toEqual({ x: true, y: true });
  });

  it("ignores null values", () => {
    const rows = [
      { id: "x", value: null },
      { id: "y", value: 20 },
    ];
    expect(bestValueMap(rows, "max")).toEqual({ y: true });
  });

  it("returns empty map when all values are null", () => {
    const rows = [
      { id: "x", value: null },
      { id: "y", value: null },
    ];
    expect(bestValueMap(rows, "max")).toEqual({});
  });
});

describe("formatSpecKey", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatSpecKey("battery_hours")).toBe("Battery hours");
    expect(formatSpecKey("ip_rating")).toBe("Ip rating");
  });
  it("handles single word", () => {
    expect(formatSpecKey("wattage")).toBe("Wattage");
  });
});

describe("formatSpecValue", () => {
  it("renders null/undefined as dash", () => {
    expect(formatSpecValue(null)).toBe("—");
    expect(formatSpecValue(undefined)).toBe("—");
  });
  it("renders booleans as Yes/No", () => {
    expect(formatSpecValue(true)).toBe("Yes");
    expect(formatSpecValue(false)).toBe("No");
  });
  it("joins arrays with commas", () => {
    expect(formatSpecValue([1, 2, 3])).toBe("1, 2, 3");
  });
  it("stringifies numbers", () => {
    expect(formatSpecValue(42)).toBe("42");
  });
  it("passes strings through", () => {
    expect(formatSpecValue("IP67")).toBe("IP67");
  });
});
