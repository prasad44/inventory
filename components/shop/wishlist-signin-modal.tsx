"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPath: string;
}

export function WishlistSignInModal({ open, onOpenChange, nextPath }: Props) {
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Save items to your wishlist
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to keep your favourites across devices and get notified when
            they go on sale.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md border border-border text-sm"
          >
            Maybe later
          </button>
          <Link
            href={loginHref}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Sign in
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
