import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: Props) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs text-muted-foreground ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-foreground font-medium" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
