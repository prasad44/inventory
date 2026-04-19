"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function TestQpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const sp = useSearchParams();
  const slug = sp.get("slug") ?? "(none)";
  return <div style={{ padding: 20 }}>Test query-param: slug={slug}</div>;
}
