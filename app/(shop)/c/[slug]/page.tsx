"use client";

import { useParams } from "next/navigation";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <p>Category: {slug}</p>
    </div>
  );
}
