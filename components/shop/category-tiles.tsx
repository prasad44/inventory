import Link from "next/link";
import * as Icons from "lucide-react";
import type { Category } from "@/lib/types";

type IconName = keyof typeof Icons;

// Fallback: if a seeded icon name isn't in lucide-react, use Package
const fallback: IconName = "Package";

function resolveIcon(name: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return Icons[fallback] as unknown as React.ComponentType<{ className?: string }>;
  // Convert "smart-home" -> "SmartHome", "lightbulb" -> "Lightbulb"
  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
  const Resolved = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[pascal];
  return Resolved ?? (Icons[fallback] as unknown as React.ComponentType<{ className?: string }>);
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {categories.map((c) => {
          const Icon = resolveIcon(c.icon);
          return (
            <Link
              key={c.id}
              href={`/c?cat=${c.slug}`}
              className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{c.name}</span>
            </Link>
          );
        })}
        <Link
          href="/deals"
          className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border bg-destructive/10 hover:border-destructive hover:bg-destructive/15 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <Icons.Flame className="h-5 w-5 text-destructive" />
          </div>
          <span className="text-sm font-medium text-destructive">Deals</span>
        </Link>
      </div>
    </section>
  );
}
