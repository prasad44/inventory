"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop route error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 grid place-items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit a snag loading this page. Please try again — or head home and
        start over.
      </p>
      {error.digest && (
        <p className="mt-2 text-[11px] text-muted-foreground font-mono">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md border border-border text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
