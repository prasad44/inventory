"use client";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import type { DeliveryZone } from "@/lib/types";
import { computeDeliveryDates, computeDeliveryFee } from "@/lib/delivery";

interface Props {
  /** Optional — when you know the current subtotal (e.g., qty × price) */
  subtotal?: number;
}

const CITY_COOKIE = "dz_city";

export function DeliveryEstimator({ subtotal = 0 }: Props) {
  const [zones, setZones] = useState<DeliveryZone[] | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/delivery-zones")
      .then((r) => (r.ok ? r.json() : { zones: [] }))
      .then((j) => {
        if (!alive) return;
        const list = (j.zones ?? []) as DeliveryZone[];
        setZones(list);
        setLoading(false);
        // Restore city from cookie
        const c = readCookie(CITY_COOKIE);
        if (c && list.some((z) => z.city === c)) setSelectedCity(c);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function onCityChange(city: string) {
    setSelectedCity(city);
    document.cookie = `${CITY_COOKIE}=${encodeURIComponent(city)}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }

  const zone = zones?.find((z) => z.city === selectedCity);

  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-medium">Delivery estimate</span>
      </div>
      <label className="block">
        <span className="sr-only">City</span>
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={loading}
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">{loading ? "Loading cities..." : "Select your city"}</option>
          {(zones ?? []).map((z) => (
            <option key={z.id} value={z.city}>
              {z.city}
            </option>
          ))}
        </select>
      </label>
      {zone && (
        <div className="mt-2 text-xs text-muted-foreground">
          {(() => {
            const { min, max } = computeDeliveryDates(new Date(), zone.est_min_days, zone.est_max_days);
            const fee = computeDeliveryFee(Number(zone.delivery_fee), subtotal);
            const dateFmt = new Intl.DateTimeFormat("en-LK", { month: "short", day: "numeric", weekday: "short" });
            const range =
              min.toDateString() === max.toDateString()
                ? dateFmt.format(min)
                : `${dateFmt.format(min)} – ${dateFmt.format(max)}`;
            return (
              <span>
                Arrives {range}
                <span className="mx-1">·</span>
                {fee === 0 ? (
                  <span className="text-success">FREE delivery</span>
                ) : (
                  <>Rs {fee.toLocaleString("en-LK")} delivery</>
                )}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}
