import Link from "next/link";

export function ShopFooter() {
  return (
    <footer className="mt-auto bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <span className="font-display font-bold text-lg">VoltHub</span>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Genuine electronics. Islandwide delivery. COD available.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Shop</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/c/audio" className="hover:text-foreground">Audio</Link></li>
            <li><Link href="/c/lighting" className="hover:text-foreground">Lighting</Link></li>
            <li><Link href="/c/solar" className="hover:text-foreground">Solar</Link></li>
            <li><Link href="/c/smart-home" className="hover:text-foreground">Smart Home</Link></li>
            <li><Link href="/deals" className="hover:text-foreground">Deals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Help</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-foreground">Shipping & returns</Link></li>
            <li><Link href="#" className="hover:text-foreground">Warranty</Link></li>
            <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
            <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Account</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link href="/account/orders" className="hover:text-foreground">Orders</Link></li>
            <li><Link href="/account/wishlist" className="hover:text-foreground">Wishlist</Link></li>
            <li><Link href="/account/alerts" className="hover:text-foreground">Alerts</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>© 2026 VoltHub. All rights reserved.</span>
          <span>Made in Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
