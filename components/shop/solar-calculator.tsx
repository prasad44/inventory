"use client";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { computeSolarSavings } from "@/lib/solar";
import { formatLKR } from "@/lib/format";
import type { Product } from "@/lib/types";

const DEFAULT_RATE_LKR_PER_KWH = 35; // CEB domestic tier 2
const DEFAULT_HOURS = 6;
const DEFAULT_REPLACED_WATTS = 40;

interface Props {
  product: Product;
}

export function SolarCalculator({ product }: Props) {
  // Pull replaced-bulb default from specs meta if available
  const meta = (product.specs?.calculator_meta ?? {}) as { replaced_bulb_watts?: number };
  const initialReplaced = typeof meta.replaced_bulb_watts === "number" ? meta.replaced_bulb_watts : DEFAULT_REPLACED_WATTS;

  const [hours, setHours] = useState<number>(DEFAULT_HOURS);
  const [rate, setRate] = useState<number>(DEFAULT_RATE_LKR_PER_KWH);
  const [replacedWatts, setReplacedWatts] = useState<number>(initialReplaced);

  const result = useMemo(
    () =>
      computeSolarSavings({
        hoursPerDay: hours,
        replacedWatts,
        rateLKR: rate,
        productPriceLKR: product.price,
      }),
    [hours, replacedWatts, rate, product.price]
  );

  const payback = Number.isFinite(result.paybackMonths) ? result.paybackMonths : null;

  return (
    <section className="mt-10 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Estimated savings</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        See how much you&apos;ll save by replacing a conventional bulb with this solar product.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Hours used per day</span>
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="tabular-nums text-foreground font-medium">{hours}h</span>
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Bulb replaced (W)</span>
          <input
            type="number"
            min={0}
            value={replacedWatts}
            onChange={(e) => setReplacedWatts(Number(e.target.value) || 0)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-muted-foreground">Electricity rate (Rs/kWh)</span>
          <input
            type="number"
            min={0}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-md bg-primary/10 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">You save</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {formatLKR(result.annualSavings)}<span className="text-sm font-normal text-muted-foreground"> / year</span>
          </div>
        </div>
        <div className="rounded-md bg-success/10 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Pays for itself in</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-success">
            {payback === null ? "—" : payback === 0 ? "Free!" : `${payback} month${payback === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Based on average CEB domestic tier rates. Actual savings vary with usage and local electricity pricing.
      </p>
    </section>
  );
}
