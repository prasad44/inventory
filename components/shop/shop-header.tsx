"use client";
import Link from "next/link";
import { Heart, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CategoryMegaMenu } from "@/components/shop/category-mega-menu";
import { ShopSearchBar } from "@/components/shop/shop-search-bar";
import { HeaderCartButton } from "@/components/shop/header-cart-button";

export function ShopHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center gap-4">
        <Link href="/" className="font-display font-bold text-lg tracking-tight shrink-0">
          VoltHub
        </Link>
        <CategoryMegaMenu />
        <div className="flex-1 max-w-xl">
          <ShopSearchBar />
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          <Link href="/account/wishlist" aria-label="Wishlist" className="p-2 rounded-md hover:bg-muted">
            <Heart className="h-4 w-4" />
          </Link>
          <Link href="/account" aria-label="Account" className="p-2 rounded-md hover:bg-muted">
            <User className="h-4 w-4" />
          </Link>
          <HeaderCartButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
