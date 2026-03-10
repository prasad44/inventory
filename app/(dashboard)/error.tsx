"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-12">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4 text-sm">{error.message || "An unexpected error occurred."}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
