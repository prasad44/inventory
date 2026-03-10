import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { Package, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Public Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/shop" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-indigo-600">
              <ShoppingBag className="h-6 w-6" />
              <span>StockUp Shop</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <Link href="/shop" className="hover:text-indigo-600 transition-colors">Products</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Categories</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Support</Link>
            </nav>

            <div className="flex items-center gap-4">
               <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Admin Login
                  </Button>
               </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-2 font-bold text-xl text-slate-400">
                  <Package className="h-5 w-5" />
                  <span>StockUp</span>
               </div>
               <p className="text-sm text-slate-500">
                  © 2026 StockUp Inventory Systems. Demo Storefront.
               </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
