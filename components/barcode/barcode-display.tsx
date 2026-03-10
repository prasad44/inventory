"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BarcodeDisplay({
  value,
  format = "CODE128",
  width = 2,
  height = 50,
  className,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue: true,
        lineColor: "currentColor",
        background: "transparent",
        margin: 4,
        fontSize: 14,
        textMargin: 4,
      });
    } catch {
      // Invalid barcode value for the chosen format — show nothing
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    }
  }, [value, format, width, height]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}
