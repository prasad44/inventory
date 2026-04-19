"use client";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

export function ShopSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search electronics, brands, categories..."
        aria-label="Search"
        className="w-full h-9 pl-9 pr-10 rounded-md border border-input bg-muted/40 text-sm placeholder:text-muted-foreground focus:bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
      />
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
        /
      </kbd>
    </div>
  );
}
