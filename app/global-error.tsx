"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);
  return (
    <html>
      <body style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>Please try again. If this keeps happening, email us.</p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: 12 }}>
            Ref: {error.digest}
          </p>
        )}
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "8px 16px" }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
