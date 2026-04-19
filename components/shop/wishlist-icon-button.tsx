"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  productId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WishlistIconButton({ productId: _productId }: Props) {
  const [saved, setSaved] = useState(false);

  function onClick() {
    // Phase 6 wires real persistence + auth gate
    setSaved((s) => !s);
    toast.success(
      saved ? "Removed from wishlist" : "Saved to wishlist (sync coming soon)"
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className="inline-flex items-center gap-2 p-2.5 rounded-md border border-border hover:border-primary text-sm"
    >
      <Heart
        className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`}
        aria-hidden="true"
      />
      <span className="hidden md:inline">{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
