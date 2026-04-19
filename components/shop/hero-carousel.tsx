"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Slide {
  eyebrow: string;
  title: string;
  sub: string;
  cta: { label: string; href: string };
  image: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Flash deals",
    title: "Up to 25% off audio",
    sub: "JBL, Sony, Bose — limited-time pricing.",
    cta: { label: "Shop deals", href: "/deals" },
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=2000&q=75&auto=format&fit=crop",
  },
  {
    eyebrow: "New in solar",
    title: "Power from the sun",
    sub: "Panels, garden lights, and street lights — built for Sri Lankan weather.",
    cta: { label: "Explore solar", href: "/c?cat=solar" },
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=2000&q=75&auto=format&fit=crop",
  },
  {
    eyebrow: "Best sellers",
    title: "Headsets under Rs 20,000",
    sub: "Proven favorites, trusted by thousands of shoppers.",
    cta: { label: "Shop headphones", href: "/c?cat=headphones&parent=audio" },
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=2000&q=75&auto=format&fit=crop",
  },
  {
    eyebrow: "Free delivery",
    title: "Islandwide, over Rs 5,000",
    sub: "Colombo in 1-2 days. Jaffna in 4-6. COD on every order.",
    cta: { label: "Start shopping", href: "/c?cat=audio" },
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=2000&q=75&auto=format&fit=crop",
  },
];

const N = SLIDES.length;
// Render order: [last-clone, ...slides, first-clone]
// DOM index 0         = clone of last
// DOM index 1..N      = real slides 0..N-1
// DOM index N+1       = clone of first
const RENDERED: Slide[] = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];

export function HeroCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0); // 0..N-1 for dots
  const [ready, setReady] = useState(false);

  /** Read current slide position from scrollLeft. */
  const getDomIdx = useCallback((): number => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return 1;
    return Math.round(el.scrollLeft / el.clientWidth);
  }, []);

  /** Silent teleport — no animation. */
  const jumpTo = useCallback((domIdx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = domIdx * el.clientWidth;
    requestAnimationFrame(() => {
      el.style.scrollBehavior = prev;
    });
  }, []);

  /** Smooth scroll to a DOM index. */
  const slideTo = useCallback((domIdx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: domIdx * el.clientWidth, behavior: "smooth" });
  }, []);

  // On mount, position at first real slide (DOM idx 1) and reveal.
  useEffect(() => {
    jumpTo(1);
    // Two frames lets layout settle before we unhide — avoids any clone flash.
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, [jumpTo]);

  // Auto-advance every 6 seconds.
  useEffect(() => {
    const id = setInterval(() => {
      slideTo(getDomIdx() + 1);
    }, 6000);
    return () => clearInterval(id);
  }, [slideTo, getDomIdx]);

  // scrollend → detect clone and teleport to real sibling.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScrollEnd() {
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx === 0) {
        // Landed on the last-slide clone at the start → teleport to real last slide.
        jumpTo(N);
        setActiveIndex(N - 1);
      } else if (idx === N + 1) {
        // Landed on the first-slide clone at the end → teleport to real first slide.
        jumpTo(1);
        setActiveIndex(0);
      } else {
        setActiveIndex(idx - 1);
      }
    }
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [jumpTo]);

  // Track intermediate scroll for dot active-state during manual swipe.
  function onScroll() {
    const idx = getDomIdx();
    if (idx >= 1 && idx <= N) {
      const real = idx - 1;
      if (real !== activeIndex) setActiveIndex(real);
    }
  }

  function goto(realIdx: number) {
    slideTo(realIdx + 1); // +1 offset for the prepended clone
  }

  return (
    <section className="relative">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={`flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none ${
          ready ? "" : "invisible"
        }`}
        style={{ scrollbarWidth: "none" }}
        aria-label="Featured promotions"
      >
        {RENDERED.map((s, i) => {
          const realIdx = i === 0 ? N - 1 : i === N + 1 ? 0 : i - 1;
          return (
            <div
              key={i}
              className="shrink-0 w-full snap-start px-4"
              aria-hidden={realIdx !== activeIndex}
            >
              <div className="relative max-w-7xl mx-auto my-4 rounded-lg border border-border overflow-hidden min-h-[360px] md:min-h-[420px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={i === 1 ? "eager" : "lazy"}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/15"
                />
                <div className="relative px-8 py-16 md:py-24 text-white">
                  <span className="text-xs uppercase tracking-[0.2em] text-primary-foreground/90 font-semibold bg-primary/80 px-2 py-1 rounded-sm">
                    {s.eyebrow}
                  </span>
                  <h1 className="mt-4 font-display text-3xl md:text-5xl font-bold leading-tight max-w-2xl text-white drop-shadow-sm">
                    {s.title}
                  </h1>
                  <p className="mt-3 text-base md:text-lg text-white/80 max-w-xl drop-shadow-sm">
                    {s.sub}
                  </p>
                  <Link
                    href={s.cta.href}
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {s.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => goto(i)}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
