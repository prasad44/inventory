"use client";
import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { kelvinToRGB } from "@/lib/kelvin-to-rgb";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export function LedTempPreview({ product }: Props) {
  const specs = (product.specs ?? {}) as { color_temp_min?: number; color_temp_max?: number };
  const min = typeof specs.color_temp_min === "number" ? specs.color_temp_min : null;
  const max = typeof specs.color_temp_max === "number" ? specs.color_temp_max : null;

  const shouldRender = min !== null && max !== null && max > min;

  const [value, setValue] = useState<number>(
    shouldRender ? Math.round((min! + max!) / 2) : 4000
  );

  const rgb = useMemo(() => kelvinToRGB(value), [value]);
  const bg = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  if (!shouldRender) return null;

  const anchors = [
    { k: 2700, label: "Warm white" },
    { k: 3500, label: "Soft white" },
    { k: 5000, label: "Daylight" },
    { k: 6500, label: "Cool daylight" },
  ].filter((a) => a.k >= min! && a.k <= max!);

  return (
    <section className="mt-10 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Preview color temperature</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        This bulb supports {min}K – {max}K. Drag the slider to preview the light tone.
      </p>

      <div
        className="h-24 rounded-md border border-border mb-4 transition-colors flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span
          className="font-mono tabular-nums text-sm font-bold"
          style={{ color: isDark(rgb) ? "#fff" : "#000" }}
        >
          {value}K
        </span>
      </div>

      <input
        type="range"
        min={min!}
        max={max!}
        step={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label="Color temperature"
      />

      {anchors.length > 1 && (
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          {anchors.map((a) => (
            <button
              key={a.k}
              type="button"
              onClick={() => setValue(a.k)}
              className="hover:text-primary cursor-pointer"
            >
              <div>{a.k}K</div>
              <div>{a.label}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function isDark({ r, g, b }: { r: number; g: number; b: number }): boolean {
  // Perceived luminance (Rec. 601)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 160;
}
