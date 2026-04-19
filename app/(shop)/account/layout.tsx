"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Heart, MapPin, BellRing, MessageSquare, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/alerts", label: "Alerts", icon: BellRing },
  { href: "/account/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/account/profile", label: "Profile", icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname ?? "/account")}`);
      } else {
        setChecked(true);
      }
    });
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Your account</h1>
      <div className="grid md:grid-cols-[220px,1fr] gap-6">
        <aside>
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
