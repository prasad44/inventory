import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface Props {
  reviews: Review[];
  onFilterRating?: (rating: number | null) => void;
  activeRating?: number | null;
}

export function RatingBreakdown({ reviews, onFilterRating, activeRating }: Props) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((x) => x.rating === r).length,
  }));
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold tabular-nums">{avg.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          out of 5 &middot; {total} review{total !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-1.5">
        {counts.map(({ rating, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const isActive = activeRating === rating;
          const Wrapper = onFilterRating ? "button" : "div";
          return (
            <Wrapper
              key={rating}
              type={onFilterRating ? "button" : undefined}
              onClick={
                onFilterRating ? () => onFilterRating(isActive ? null : rating) : undefined
              }
              className={`w-full flex items-center gap-2 text-xs ${
                onFilterRating ? "hover:bg-muted rounded px-1 py-0.5 cursor-pointer" : ""
              } ${isActive ? "bg-muted rounded px-1 py-0.5" : ""}`}
            >
              <span className="inline-flex items-center gap-0.5 w-10 tabular-nums">
                {rating}
                <Star className="h-3 w-3 fill-warning text-warning" />
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-warning transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground tabular-nums">
                {count}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
