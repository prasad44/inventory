import { describe, it, expect } from "vitest";
import { kelvinToRGB } from "../kelvin-to-rgb";

describe("kelvinToRGB", () => {
  it("returns warm color at 2700K (red > green > blue)", () => {
    const { r, g, b } = kelvinToRGB(2700);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(r).toBeGreaterThanOrEqual(200);
  });

  it("returns near-white at 6500K (r, g, b roughly balanced)", () => {
    const { r, g, b } = kelvinToRGB(6500);
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    expect(maxDiff).toBeLessThan(60);
  });

  it("returns a cool tint above 6500K (blue > red)", () => {
    const { r, b } = kelvinToRGB(10000);
    expect(b).toBeGreaterThan(r);
  });

  it("clamps each channel to [0, 255]", () => {
    const { r, g, b } = kelvinToRGB(2000);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(255);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(255);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(255);
  });
});
