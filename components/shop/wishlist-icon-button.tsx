"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { WishlistSignInModal } from "@/components/shop/wishlist-signin-modal";

interface Props {
  productId: string;
}

export function WishlistIconButton({ productId }: Props) {
  const { has, add, remove, isAuthed } = useWishlist();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const saved = has(productId);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await remove(productId);
        toast.success("Removed from wishlist");
      } else {
        await add(productId);
        toast.success("Saved to wishlist");
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "UNAUTH" || isAuthed === false) {
        setShowSignIn(true);
      } else {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        disabled={busy}
        className="inline-flex items-center gap-2 p-2.5 rounded-md border border-border hover:border-primary text-sm disabled:opacity-50"
      >
        <Heart
          className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`}
          aria-hidden="true"
        />
        <span className="hidden md:inline">{saved ? "Saved" : "Save"}</span>
      </button>
      <WishlistSignInModal
        open={showSignIn}
        onOpenChange={setShowSignIn}
        nextPath={pathname ?? "/"}
      />
    </>
  );
}
