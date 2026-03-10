"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  Settings,
  LogOut,
  Menu,
  FolderTree,
  Users,
  FileText,
  User,
  ScanLine,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { value: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
  { value: "pos", label: "POS", icon: ScanLine, href: "/pos" },
  { value: "inventory", label: "Inventory", icon: Package, href: "/inventory" },
  { value: "orders", label: "Orders", icon: ShoppingCart, href: "/orders" },
  { value: "suppliers", label: "Suppliers", icon: Truck, href: "/suppliers" },
  { value: "settings", label: "Settings", icon: Settings, href: "/settings" },
  { value: "shop", label: "View Shop", icon: ShoppingCart, href: "/shop" },
];

export function RibbonNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab =
    mainNavItems.find((t) =>
      pathname.startsWith(t.href)
    )?.value ?? "home";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <span>StockUp</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <Link
                  key={item.value}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-sm font-medium leading-none">{profile?.full_name || "User"}</span>
             <span className="text-xs text-muted-foreground capitalize">{profile?.role || "Guest"}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage
                    src={profile?.avatar_url}
                    alt={profile?.full_name ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sub-ribbon for Settings (only visible on settings pages) */}
      {activeTab === "settings" && (
        <div className="border-t bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto">
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  pathname === "/settings"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <FolderTree className="h-3.5 w-3.5" />
                Categories
              </Link>
              {profile?.role === "admin" && (
                <>
                  <Link
                    href="/settings/users"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                      pathname === "/settings/users"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Users
                  </Link>
                  <Link
                    href="/settings/audit-log"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                      pathname === "/settings/audit-log"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Audit Log
                  </Link>
                </>
              )}
            </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background p-4 space-y-2 animate-in slide-in-from-top-2">
          {mainNavItems.map((item) => {
             const isActive = activeTab === item.value;
            return (
              <Link
                key={item.value}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
