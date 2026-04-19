"use client";
import { useState } from "react";
import { Upload, X, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  maxImages?: number;
}

export function ImagesGalleryUpload({ value, onChange, maxImages = 6 }: Props) {
  const [uploading, setUploading] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error(`Max ${maxImages} images`);
      e.target.value = "";
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const sb = createClient();
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          continue;
        }
        const { data: pub } = sb.storage.from("product-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, idx) => (
          <div key={`${url}-${idx}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[9px] text-center py-0.5">
                Primary
              </span>
            )}
            <div className="absolute inset-x-0 top-0 flex gap-0.5 justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                aria-label="Move up"
                className="text-xs px-1 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === value.length - 1}
                aria-label="Move down"
                className="text-xs px-1 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label="Remove"
                className="text-xs px-1 text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {value.length < maxImages && (
          <label className="w-20 h-20 rounded-md border border-dashed border-border grid place-items-center text-muted-foreground cursor-pointer hover:border-primary hover:text-primary">
            {uploading ? (
              <span className="text-[10px]">Uploading...</span>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">Add</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        First image is the primary display. Up to {maxImages} images, 10MB each.
      </p>
      <GripVertical className="hidden" aria-hidden="true" />
    </div>
  );
}
