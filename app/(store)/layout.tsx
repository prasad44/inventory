"use client";

import { useState } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const marqueeItems = [
  "Free Shipping Over $50",
  "Premium Quality Guaranteed",
  "30-Day Easy Returns",
  "Secure Checkout",
  "Curated Selection",
];

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className={`${playfair.variable} ${dmSans.variable} min-h-screen flex flex-col font-body`}
    >
      {/* ── Announcement Bar ── */}
      <div className="bg-[#1A1A1A] py-2.5 overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map(
            (item, i) => (
              <span
                key={i}
                className="shrink-0 text-[#B8956A] text-[10px] tracking-[0.25em] uppercase mx-8 inline-flex items-center gap-3"
              >
                <span className="h-1 w-1 rounded-full bg-[#B8956A]/50" />
                {item}
              </span>
            )
          )}
        </div>
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8E4DE]">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center h-[72px] px-5 sm:px-6 lg:px-8">
          {/* Left: Nav (desktop) / Hamburger (mobile) */}
          <div>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-[#2C2C2C] text-[11px] tracking-[0.18em] uppercase hover:text-[#B8956A] transition-colors duration-300"
              >
                Shop
              </Link>
              <Link
                href="/"
                className="text-[#8C8477] text-[11px] tracking-[0.18em] uppercase hover:text-[#B8956A] transition-colors duration-300"
              >
                Collections
              </Link>
              <Link
                href="#"
                className="text-[#8C8477] text-[11px] tracking-[0.18em] uppercase hover:text-[#B8956A] transition-colors duration-300"
              >
                About
              </Link>
            </nav>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#2C2C2C] p-1 -ml-1"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex justify-center items-center gap-3">
            <div className="h-px w-6 bg-[#B8956A] hidden sm:block" />
            <span className="font-serif text-xl md:text-2xl tracking-[0.25em] text-[#2C2C2C] uppercase">
              StockUp
            </span>
            <div className="h-px w-6 bg-[#B8956A] hidden sm:block" />
          </Link>

          {/* Right: Actions */}
          <div className="flex justify-end items-center gap-5">
            <Link
              href="/login"
              className="text-[#8C8477] text-[11px] tracking-[0.18em] uppercase hover:text-[#B8956A] transition-colors duration-300 hidden sm:block"
            >
              Account
            </Link>
            <Link href="/login" className="sm:hidden text-[#8C8477]">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8E4DE] bg-[#FDFBF7] px-5 py-8 space-y-5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#2C2C2C] text-sm tracking-[0.12em] uppercase"
            >
              Shop
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#8C8477] text-sm tracking-[0.12em] uppercase"
            >
              Collections
            </Link>
            <Link
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#8C8477] text-sm tracking-[0.12em] uppercase"
            >
              About
            </Link>
            <div className="h-px bg-[#E8E4DE]" />
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#8C8477] text-sm tracking-[0.12em] uppercase"
            >
              Account
            </Link>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 bg-[#FDFBF7]">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Brand */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-8 bg-[#B8956A]/40" />
              <span className="font-serif text-2xl tracking-[0.25em] uppercase">
                StockUp
              </span>
              <div className="h-px w-8 bg-[#B8956A]/40" />
            </div>
            <p className="text-[#FDFBF7]/35 text-sm max-w-md mx-auto leading-relaxed">
              Your destination for premium products, thoughtfully curated for
              the modern lifestyle.
            </p>
          </div>

          <div className="h-px bg-[#FDFBF7]/8 mb-14" />

          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center sm:text-left mb-14">
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#B8956A] mb-5">
                Shop
              </h4>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  All Products
                </Link>
                <Link
                  href="/"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  New Arrivals
                </Link>
                <Link
                  href="/"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  Best Sellers
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#B8956A] mb-5">
                Help
              </h4>
              <div className="space-y-3">
                <Link
                  href="#"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  FAQ
                </Link>
                <Link
                  href="#"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  Shipping &amp; Returns
                </Link>
                <Link
                  href="#"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#B8956A] mb-5">
                Connect
              </h4>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  Twitter / X
                </a>
                <a
                  href="mailto:hello@stockup.com"
                  className="block text-sm text-[#FDFBF7]/50 hover:text-[#B8956A] transition-colors duration-300"
                >
                  hello@stockup.com
                </a>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#FDFBF7]/8" />
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-[#FDFBF7]/25 tracking-wide">
            &copy; 2026 StockUp. All rights reserved.
          </p>
          <p className="text-[11px] text-[#FDFBF7]/25 tracking-wide">
            Demo Storefront
          </p>
        </div>
      </footer>
    </div>
  );
}
