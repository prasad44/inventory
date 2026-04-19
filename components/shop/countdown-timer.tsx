"use client";
import { useEffect, useState } from "react";
import { formatCountdown, type CountdownParts } from "@/lib/countdown";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface Props {
  endsAt: string | Date;
  className?: string;
  /** Show days segment only if there's at least one day remaining. Default true. */
  hideEmptyDays?: boolean;
}

export function CountdownTimer({ endsAt, className = "", hideEmptyDays = true }: Props) {
  const end = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts: CountdownParts = formatCountdown(end - now);
  const expired = end - now <= 0;

  if (expired) {
    return <span className={`text-xs text-muted-foreground ${className}`}>Ended</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${className}`}
      aria-label={`Ends in ${parts.d} days ${parts.h} hours ${parts.m} minutes ${parts.s} seconds`}
    >
      {(!hideEmptyDays || parts.d > 0) && (
        <>
          <span>{pad(parts.d)}d</span>
          <span className="mx-0.5">:</span>
        </>
      )}
      <span>{pad(parts.h)}h</span>
      <span className="mx-0.5">:</span>
      <span>{pad(parts.m)}m</span>
      <span className="mx-0.5">:</span>
      <span>{pad(parts.s)}s</span>
    </span>
  );
}
