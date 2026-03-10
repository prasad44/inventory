"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseBarcodeScanner {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

/**
 * Detects USB/Bluetooth barcode scanners that emulate rapid keyboard input + Enter.
 * Characters arriving within 50ms of each other are buffered as scanner input.
 * Enter key with a buffer of 4+ chars triggers the onScan callback.
 */
export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScanner) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScanRef = useRef(onScan);

  // Keep callback ref current without re-attaching listener
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const clearBuffer = useCallback(() => {
    bufferRef.current = "";
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearBuffer();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea (except our search input scenario)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      if (e.key === "Enter" && bufferRef.current.length >= 4) {
        e.preventDefault();
        e.stopPropagation();
        const barcode = bufferRef.current;
        clearBuffer();
        onScanRef.current(barcode);
        return;
      }

      // Only buffer printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If too much time has passed, start a new buffer
        if (timeSinceLastKey > 50) {
          // Only reset if this looks like scanner speed (not normal typing)
          // For the first character, just start buffering
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
        lastKeyTimeRef.current = now;

        // Safety timeout: clear buffer if scan isn't completed within 200ms
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, 200);

        // If we're building a scanner buffer (rapid input), prevent it from going to inputs
        if (bufferRef.current.length >= 3 && !isInput) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      clearBuffer();
    };
  }, [enabled, clearBuffer]);
}
