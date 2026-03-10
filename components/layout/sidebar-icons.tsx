"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: ShoppingCart, label: "Orders", href: "/orders" },
  { icon: Truck, label: "Suppliers", href: "/suppliers" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function SidebarIcons() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-14 flex-col items-center gap-1 border-r bg-muted/40 py-2">
      {sidebarItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </aside>
  );
}
