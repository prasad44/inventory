"use client";
import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/lib/hooks/use-compare";

export function CompareFloatingPill() {
  const { ids, count, clear } = useCompare();

  if (count < 2) return null; // Need at least 2 to compare

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card shadow-lg px-3 py-2 text-sm">
      <GitCompare className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="font-medium">Compare ({count})</span>
      <Link
        href={`/compare?ids=${ids.join(",")}`}
        className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
      >
        Compare now
      </Link>
      <button
        type="button"
        onClick={clear}
        aria-label="Clear comparison"
        className="p-1 rounded hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
