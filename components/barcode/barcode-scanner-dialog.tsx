"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CameraOff, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type ScannerState = "initializing" | "scanning" | "no-camera" | "permission-denied";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerDialogProps) {
  const [state, setState] = useState<ScannerState>("initializing");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerIdRef = useRef(`barcode-reader-${Date.now()}`);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (scannerState === 2 || scannerState === 3) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setState("initializing");

    // Generate a fresh ID each time
    readerIdRef.current = `barcode-reader-${Date.now()}`;

    // Small delay to ensure the DOM element is rendered
    await new Promise((r) => setTimeout(r, 100));

    const el = document.getElementById(readerIdRef.current);
    if (!el) return;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setState("no-camera");
        return;
      }

      const scanner = new Html5Qrcode(readerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          onScan(decodedText);
          onOpenChange(false);
        },
        () => {
          // ignore scan failures (no barcode in frame)
        }
      );

      setState("scanning");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes("NotAllowedError") ||
        message.includes("Permission")
      ) {
        setState("permission-denied");
      } else {
        setState("no-camera");
      }
    }
  }, [onScan, onOpenChange]);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera viewport */}
          <div
            id={readerIdRef.current}
            className="w-full min-h-[240px] rounded-lg overflow-hidden bg-muted"
          />

          {/* Initializing */}
          {state === "initializing" && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting camera...
            </div>
          )}

          {/* Scanning */}
          {state === "scanning" && (
            <p className="text-center text-sm text-muted-foreground">
              Point your camera at a barcode
            </p>
          )}

          {/* No camera available */}
          {state === "no-camera" && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center space-y-2">
              <CameraOff className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No camera detected</p>
              <p className="text-xs text-muted-foreground">
                Connect a camera or use a USB barcode scanner instead.
              </p>
            </div>
          )}

          {/* Permission denied */}
          {state === "permission-denied" && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center space-y-3">
              <CameraOff className="h-8 w-8 mx-auto text-destructive" />
              <p className="text-sm font-medium text-destructive">
                Camera access denied
              </p>
              <p className="text-xs text-muted-foreground">
                Allow camera access in your browser settings, then try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopScanner().then(startScanner);
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
