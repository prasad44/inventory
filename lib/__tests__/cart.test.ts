import { describe, it, expect } from "vitest";
import { mergeCarts } from "../cart";

describe("mergeCarts", () => {
  it("sums quantities for same product across both carts", () => {
    const guest = [{ product_id: "a", quantity: 2 }];
    const user = [{ product_id: "a", quantity: 3 }];
    const stock = new Map([["a", 100]]);
    expect(mergeCarts(guest, user, stock)).toEqual([{ product_id: "a", quantity: 5 }]);
  });

  it("caps combined quantity at stock", () => {
    const guest = [{ product_id: "a", quantity: 8 }];
    const user = [{ product_id: "a", quantity: 5 }];
    const stock = new Map([["a", 10]]);
    expect(mergeCarts(guest, user, stock)).toEqual([{ product_id: "a", quantity: 10 }]);
  });

  it("keeps distinct products", () => {
    const guest = [{ product_id: "a", quantity: 2 }];
    const user = [{ product_id: "b", quantity: 1 }];
    const stock = new Map([
      ["a", 100],
      ["b", 100],
    ]);
    const merged = mergeCarts(guest, user, stock);
    expect(merged).toHaveLength(2);
    expect(merged.find((i) => i.product_id === "a")?.quantity).toBe(2);
    expect(merged.find((i) => i.product_id === "b")?.quantity).toBe(1);
  });

  it("drops products whose stock is zero", () => {
    const guest = [{ product_id: "a", quantity: 2 }];
    const user: { product_id: string; quantity: number }[] = [];
    const stock = new Map([["a", 0]]);
    expect(mergeCarts(guest, user, stock)).toEqual([]);
  });

  it("drops products missing from stock map (treat as zero)", () => {
    const guest = [{ product_id: "a", quantity: 2 }];
    const user: { product_id: string; quantity: number }[] = [];
    const stock = new Map<string, number>();
    expect(mergeCarts(guest, user, stock)).toEqual([]);
  });

  it("returns the user cart unchanged when guest cart is empty", () => {
    const guest: { product_id: string; quantity: number }[] = [];
    const user = [{ product_id: "a", quantity: 3 }];
    const stock = new Map([["a", 10]]);
    expect(mergeCarts(guest, user, stock)).toEqual([{ product_id: "a", quantity: 3 }]);
  });
});
