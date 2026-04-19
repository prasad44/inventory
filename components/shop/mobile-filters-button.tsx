"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FiltersRail } from "@/components/shop/filters-rail";
import type { Category } from "@/lib/types";

interface Props {
  childrenCategories: Pick<Category, "id" | "name" | "slug">[];
  availableBrands: string[];
}

function countActiveFilters(sp: URLSearchParams): number {
  let n = 0;
  const brand = sp.get("brand");
  if (brand) n += brand.split(",").map((s) => s.trim()).filter(Boolean).length;
  if (sp.get("min_price")) n++;
  if (sp.get("max_price")) n++;
  if (sp.get("min_rating")) n++;
  if (sp.get("on_sale") === "1") n++;
  if (sp.get("in_stock") === "1") n++;
  return n;
}

export function MobileFiltersButton({ childrenCategories, availableBrands }: Props) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const count = countActiveFilters(new URLSearchParams(searchParams.toString()));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-primary text-primary-foreground text-sm font-medium"
          aria-label={`Open filters${count > 0 ? ` (${count} active)` : ""}`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {count > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-background text-primary text-[11px] font-bold tabular-nums">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-8">
          <FiltersRail
            childrenCategories={childrenCategories}
            availableBrands={availableBrands}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
