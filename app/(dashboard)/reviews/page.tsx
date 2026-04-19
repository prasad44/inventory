"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { Review, Product, Profile } from "@/lib/types";

type Status = "all" | "pending" | "approved" | "rejected";

type ReviewRow = Omit<Review, "product" | "user"> & {
  product?: Pick<Product, "id" | "name" | "slug"> | null;
  user?: Pick<Profile, "full_name"> | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "approved") return "default";
  if (s === "pending") return "secondary";
  if (s === "rejected") return "destructive";
  return "outline";
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const url = status === "all" ? "/api/admin/reviews" : `/api/admin/reviews?status=${status}`;
    const res = await fetch(url);
    const json = await res.json();
    setReviews((json.reviews ?? []) as ReviewRow[]);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const setReviewStatus = async (id: string, newStatus: "approved" | "rejected" | "pending") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Update failed");
      }
      toast.success(
        newStatus === "approved"
          ? "Review approved"
          : newStatus === "rejected"
            ? "Review rejected"
            : "Review reset to pending"
      );
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Moderate customer product reviews</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-[140px]">Reviewer</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No reviews {status !== "all" ? `in ${status}` : ""}.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.product ? (
                      <Link
                        href={`/p?slug=${r.product.slug}`}
                        target="_blank"
                        className="text-sm font-medium hover:underline"
                      >
                        {r.product.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">(deleted)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.user?.full_name ?? <span className="text-muted-foreground">Anonymous</span>}
                  </TableCell>
                  <TableCell>
                    <Stars rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-[360px]">
                    {r.title && <div className="truncate text-sm font-medium">{r.title}</div>}
                    {r.body && <div className="line-clamp-2 text-xs text-muted-foreground">{r.body}</div>}
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                      {r.verified_purchase && <span className="ml-2">· Verified</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)} className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          disabled={updatingId === r.id}
                          onClick={() => setReviewStatus(r.id, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="ml-1">Approve</span>
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          disabled={updatingId === r.id}
                          onClick={() => setReviewStatus(r.id, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="ml-1">Reject</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
