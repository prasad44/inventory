"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MessageSquare, Star, Trash2 } from "lucide-react";
import type { Product, Review } from "@/lib/types";

type ReviewRow = Omit<Review, "product"> & { product: Product | null };

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);

  function refetch() {
    setReviews(null);
    fetch("/api/account/reviews")
      .then((r) => r.json())
      .then((j) => setReviews((j.reviews ?? []) as ReviewRow[]))
      .catch(() => setReviews([]));
  }

  useEffect(refetch, []);

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(
      `/api/account/reviews?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Review deleted");
      refetch();
    } else {
      toast.error("Could not delete");
    }
  }

  if (reviews === null) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-medium">No reviews yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          After you buy and try a product, share your thoughts with other shoppers.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {r.product && (
                <Link
                  href={`/p?slug=${encodeURIComponent(r.product.slug)}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {r.product.name}
                </Link>
              )}
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              {r.title && (
                <div className="mt-1.5 font-semibold text-sm">{r.title}</div>
              )}
              {r.body && (
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                  {r.body}
                </p>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
                {r.verified_purchase && (
                  <span className="ml-2 text-success">· Verified purchase</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              aria-label="Delete review"
              className="p-1.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
