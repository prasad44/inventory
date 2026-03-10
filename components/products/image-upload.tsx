"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(`Upload failed: ${msg}`);
      console.error("Upload process error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Product"
            width={128}
            height={128}
            className="h-32 w-32 rounded-md border object-cover"
            unoptimized
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
