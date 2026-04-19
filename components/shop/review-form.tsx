"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { Star, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  productId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, onSubmitted }: Props) {
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!alive) return;
      setUserId(user?.id ?? null);
      setIsAuthed(!!user);
      setAuthChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const available = 4 - imageUrls.length;
    const toUpload = files.slice(0, available);
    if (!userId) {
      toast.error("Please sign in to upload photos");
      return;
    }
    setUploading(true);
    try {
      const sb = createClient();
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("review-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          continue;
        }
        const { data: pub } = sb.storage.from("review-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
          images: imageUrls,
        }),
      });
      if (res.status === 409) {
        toast.error("You've already reviewed this product");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Could not submit review");
      }
      toast.success("Thanks for your review!");
      setRating(0);
      setTitle("");
      setBody("");
      setImageUrls([]);
      onSubmitted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!isAuthed) {
    const next = encodeURIComponent(pathname ?? "/");
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <Link
          href={`/login?next=${next}`}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>{" "}
        to write a review.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold">Write a review</h3>
      <div>
        <label className="text-sm block mb-1">
          Your rating <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hoverRating || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    filled ? "fill-warning text-warning" : "text-muted-foreground/40"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm block mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Sum up your experience in a few words"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div>
        <label className="text-sm block mb-1">Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What did you like or dislike? Who would you recommend it to?"
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div>
        <label className="text-sm block mb-2">Photos ({imageUrls.length}/4)</label>
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <div
              key={url}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {imageUrls.length < 4 && (
            <label className="w-20 h-20 rounded-md border border-dashed border-border grid place-items-center text-muted-foreground cursor-pointer hover:border-primary hover:text-primary">
              {uploading ? (
                <span className="text-[10px]">Uploading...</span>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFilesChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || rating < 1}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Post review"}
      </button>
    </form>
  );
}
