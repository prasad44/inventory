"use client";
import { GitCompare } from "lucide-react";
import toast from "react-hot-toast";
import { useCompare } from "@/lib/hooks/use-compare";

interface Props {
  productId: string;
}

export function CompareIconButton({ productId }: Props) {
  const { has, toggle } = useCompare();
  const active = has(productId);

  function onClick() {
    const result = toggle(productId);
    if (result.isFull) {
      toast.error("You can compare up to 4 products. Remove one first.");
      return;
    }
    toast.success(result.added ? "Added to compare" : "Removed from compare");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 p-2.5 rounded-md border text-sm ${
        active
          ? "border-primary text-primary"
          : "border-border hover:border-primary"
      }`}
    >
      <GitCompare className="h-4 w-4" aria-hidden="true" />
      <span className="hidden md:inline">
        {active ? "Comparing" : "Compare"}
      </span>
    </button>
  );
}
