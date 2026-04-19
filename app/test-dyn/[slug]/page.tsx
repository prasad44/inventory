"use client";

import { useParams } from "next/navigation";

export default function TestDynPage() {
  const { slug } = useParams<{ slug: string }>();
  return <div style={{ padding: 20 }}>Test dynamic route: {slug}</div>;
}
