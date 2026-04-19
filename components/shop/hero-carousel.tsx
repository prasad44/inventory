"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  {
    eyebrow: "Flash deals",
    title: "Up to 25% off audio",
    sub: "JBL, Sony, Bose — limited-time pricing.",
    cta: { label: "Shop deals", href: "/deals" },
    // Soft violet gradient background, no image needed for MVP
    bg: "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent",
  },
  {
    eyebrow: "New in solar",
    title: "Power your home from the sun",
    sub: "Panels, garden lights, and street lights — built for Sri Lankan weather.",
    cta: { label: "Explore solar", href: "/c/solar" },
    bg: "bg-gradient-to-br from-warning/20 via-warning/5 to-transparent",
  },
  {
    eyebrow: "Best sellers",
    title: "Headsets under Rs 20,000",
    sub: "Proven favorites, trusted by thousands of shoppers.",
    cta: { label: "Shop headphones", href: "/c/audio/headphones" },
    bg: "bg-gradient-to-br from-success/15 via-success/5 to-transparent",
  },
  {
    eyebrow: "Free delivery",
    title: "Islandwide, over Rs 5,000",
    sub: "Colombo in 1-2 days. Jaffna in 4-6. COD on every order.",
    cta: { label: "Start shopping", href: "/c/audio" },
    bg: "bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent",
  },
];

export function HeroCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (activeIndex + 1) % SLIDES.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setActiveIndex(next);
    }, 6000);
    return () => clearInterval(id);
  }, [activeIndex]);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  }

  return (
    <section className="relative">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: "none" }}
        aria-label="Featured promotions"
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`shrink-0 w-full snap-start px-4`}
            aria-hidden={activeIndex !== i}
          >
            <div className={`max-w-7xl mx-auto my-4 rounded-lg ${s.bg} border border-border px-8 py-16 md:py-24`}>
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                {s.eyebrow}
              </span>
              <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold leading-tight max-w-2xl">
                {s.title}
              </h1>
              <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-xl">{s.sub}</p>
              <Link
                href={s.cta.href}
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {s.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => {
              const el = scrollerRef.current;
              if (!el) return;
              el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              setActiveIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
