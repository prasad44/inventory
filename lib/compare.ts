/**
 * Pure helpers for the /compare page.
 * Kept framework-agnostic and TDD-covered.
 */

/**
 * Per-spec-key direction for "best value" highlighting on comparison.
 * Not exhaustive — unknown keys are ignored (no highlight).
 */
export const SPEC_DIRECTION: Record<string, "max" | "min"> = {
  // Numeric "bigger is better"
  battery_hours: "max",
  battery_wh: "max",
  capacity_mah: "max",
  capacity_gb: "max",
  power_w: "max",
  wattage: "max",
  lumens: "max",
  driver_mm: "max",
  panel_watts: "max",
  led_watts: "max",
  output_w: "max",
  data_gbps: "max",
  read_mbps: "max",
  usb_ports: "max",
  hdmi_in: "max",
  case_hours: "max",
  length_m: "max",
  rating_avg: "max",
  rating_count: "max",

  // Numeric "smaller is better"
  weight_g: "min",
  impedance_ohm: "min",
  price: "min",
};

const INTERNAL_KEY_PREFIXES = ["calculator_"];

function isInternalKey(key: string): boolean {
  return INTERNAL_KEY_PREFIXES.some((p) => key.startsWith(p));
}

export interface SpecSource {
  specs?: Record<string, unknown> | null;
}

export function computeSpecRows(products: SpecSource[]): string[] {
  const keys = new Set<string>();
  for (const p of products) {
    if (!p.specs) continue;
    for (const k of Object.keys(p.specs)) {
      if (!isInternalKey(k)) keys.add(k);
    }
  }
  return Array.from(keys);
}

export function formatSpecKey(key: string): string {
  if (!key) return key;
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatSpecValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export interface BestValueRow {
  id: string;
  value: number | null;
}

/**
 * Given rows of (id, numeric value | null), return a map from id → true for
 * rows holding the best value per direction. Ties all win. All-null → {}.
 */
export function bestValueMap(
  rows: BestValueRow[],
  direction: "max" | "min"
): Record<string, boolean> {
  const numeric = rows.filter((r) => r.value !== null) as Array<{
    id: string;
    value: number;
  }>;
  if (numeric.length === 0) return {};

  const best = numeric.reduce(
    (acc, r) => {
      if (direction === "max") return r.value > acc ? r.value : acc;
      return r.value < acc ? r.value : acc;
    },
    direction === "max" ? -Infinity : Infinity
  );

  const map: Record<string, boolean> = {};
  for (const r of numeric) {
    if (r.value === best) map[r.id] = true;
  }
  return map;
}

/** Extracts a comparable numeric from an arbitrary spec value, or null. */
export function toComparableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    // Try to parse leading number from strings like "30-40000", "IP67"
    const match = value.match(/^-?\d+(\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return null;
}
