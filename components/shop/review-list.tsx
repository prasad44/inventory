"use client";
import { useState } from "react";
import { Star, ThumbsUp, BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Review } from "@/lib/types";
import { RatingBreakdown } from "@/components/shop/rating-breakdown";
import { ReviewForm } from "@/components/shop/review-form";

interface Props {
  productId: string;
  initialReviews: Review[];
}

type RatingFilter = number | null;

export function ReviewList({ productId, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== null && r.rating !== ratingFilter) return false;
    if (withPhotosOnly && (r.images?.length ?? 0) === 0) return false;
    if (verifiedOnly && !r.verified_purchase) return false;
    return true;
  });

  async function onHelpful(id: string) {
    if (helpfulVoted.has(id)) return;
    setHelpfulVoted((prev) => new Set(prev).add(id));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r))
    );
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/helpful`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      toast.error("Could not submit vote");
      // revert
      setHelpfulVoted((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, helpful_count: Math.max(0, r.helpful_count - 1) } : r
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-[320px,1fr] gap-6">
        <RatingBreakdown
          reviews={reviews}
          activeRating={ratingFilter}
          onFilterRating={setRatingFilter}
        />
        <div>
          <ReviewForm
            productId={productId}
            onSubmitted={() => {
              // Could refetch; for MVP just inform the user
              toast.success("Your review will appear after a moment");
            }}
          />
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterChip
            active={!ratingFilter && !withPhotosOnly && !verifiedOnly}
            onClick={() => {
              setRatingFilter(null);
              setWithPhotosOnly(false);
              setVerifiedOnly(false);
            }}
          >
            All
          </FilterChip>
          <FilterChip
            active={withPhotosOnly}
            onClick={() => setWithPhotosOnly((v) => !v)}
          >
            With photos
          </FilterChip>
          <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            Verified
          </FilterChip>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {reviews.length === 0
            ? "No reviews yet. Be the first to review this product."
            : "No reviews match the current filters."}
        </p>
      ) : (
        <ul className="space-y-6">
          {filtered.map((r) => (
            <li key={r.id} className="border-b border-border pb-4 last:border-b-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{r.user?.full_name ?? "Customer"}</span>
                {r.verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-success">
                    <BadgeCheck className="h-3 w-3" />
                    Verified purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              {r.title && <h4 className="mt-1.5 font-semibold text-sm">{r.title}</h4>}
              {r.body && (
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                  {r.body}
                </p>
              )}
              {r.images && r.images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {r.images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="h-20 w-20 rounded-md object-cover border border-border"
                    />
                  ))}
                </div>
              )}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onHelpful(r.id)}
                  disabled={helpfulVoted.has(r.id)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    helpfulVoted.has(r.id)
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  Helpful ({r.helpful_count})
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
