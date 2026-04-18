"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ArrowRight,
  Package,
  Truck,
  Shield,
  Headphones,
  Search,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products?status=active")
      .then((r) => r.json())
      .then((j) => {
        setProducts(j.data || []);
        setLoading(false);
      });
  }, []);

  /* ── Cart Operations ── */

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success("Added to bag", {
      style: {
        background: "#2C2C2C",
        color: "#FDFBF7",
        fontSize: "13px",
        letterSpacing: "0.04em",
      },
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id === id) {
          return { ...i, qty: Math.max(1, i.qty + delta) };
        }
        return i;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product.id,
            quantity: i.qty,
            unit_price: i.product.price,
          })),
        }),
      });
      if (res.ok) {
        setIsCheckoutSuccess(true);
        setCart([]);
        setCartOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Checkout failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCheckingOut(false);
    }
  };

  /* ── Derived Data ── */

  const categories = [
    ...new Set(
      products.filter((p) => p.category).map((p) => p.category!.name)
    ),
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat =
      activeCategory === "all" || p.category?.name === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── Checkout Success ── */

  if (isCheckoutSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div
          className="max-w-md text-center px-6"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-10 bg-[#B8956A]" />
            <CheckCircle2 className="h-8 w-8 text-[#B8956A]" />
            <div className="h-px w-10 bg-[#B8956A]" />
          </div>
          <h1 className="font-sans text-4xl md:text-5xl text-[#2C2C2C] mb-4">
            Thank You
          </h1>
          <p className="text-[#8C8477] leading-relaxed mb-12">
            Your order has been placed successfully and inventory has been
            updated. We appreciate your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsCheckoutSuccess(false)}
              className="bg-[#2C2C2C] text-[#FDFBF7] px-10 py-4 text-xs tracking-[0.18em] uppercase hover:bg-[#B8956A] transition-colors duration-500"
            >
              Continue Shopping
            </button>
            <Link
              href="/"
              className="border border-[#E8E4DE] text-[#2C2C2C] px-10 py-4 text-xs tracking-[0.18em] uppercase hover:border-[#B8956A] hover:text-[#B8956A] transition-colors duration-300 inline-block text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Render ── */

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E8] to-[#EDE6D8]" />

        {/* Decorative blurred orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#B8956A]/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#B8956A]/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#B8956A]/[0.02] blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-3xl px-6">
          {/* Decorative accent line */}
          <div
            className="flex items-center justify-center gap-4 mb-12"
          >
            <div className="h-px w-14 bg-[#B8956A]" />
            <span className="text-[#B8956A] text-[10px] tracking-[0.4em] uppercase">
              Est. 2026
            </span>
            <div className="h-px w-14 bg-[#B8956A]" />
          </div>

          {/* Heading */}
          <h1
            className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-[#2C2C2C] leading-[1.08] mb-8"
          >
            Thoughtfully
            <br />
            <em className="not-italic text-[#B8956A]">Curated</em>
          </h1>

          {/* Subtitle */}
          <p
            className="text-[#8C8477] text-lg md:text-xl max-w-lg mx-auto mb-14 leading-relaxed"
          >
            Discover our collection of premium products, selected for
            exceptional quality and timeless design.
          </p>

          {/* CTA */}
          <div>
            <button
              onClick={scrollToProducts}
              className="group inline-flex items-center gap-3 bg-[#2C2C2C] text-[#FDFBF7] px-12 py-4.5 text-xs tracking-[0.22em] uppercase hover:bg-[#B8956A] transition-all duration-500"
            >
              Explore Collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Bottom decorative element */}
          <div
            className="flex items-center justify-center gap-3 mt-16"
          >
            <div className="h-px w-6 bg-[#E8E4DE]" />
            <div className="h-1.5 w-1.5 rotate-45 border border-[#B8956A]/40" />
            <div className="h-px w-6 bg-[#E8E4DE]" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUST MARQUEE
         ════════════════════════════════════════════════════════ */}
      <div className="bg-[#2C2C2C] py-4 overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {[
            "Free Shipping Over $50",
            "Premium Quality",
            "30-Day Returns",
            "Secure Checkout",
            "Curated Selection",
            "Free Shipping Over $50",
            "Premium Quality",
            "30-Day Returns",
            "Secure Checkout",
            "Curated Selection",
            "Free Shipping Over $50",
            "Premium Quality",
            "30-Day Returns",
            "Secure Checkout",
            "Curated Selection",
            "Free Shipping Over $50",
            "Premium Quality",
            "30-Day Returns",
            "Secure Checkout",
            "Curated Selection",
          ].map((item, i) => (
            <span
              key={i}
              className="shrink-0 text-[#FDFBF7]/40 text-[10px] tracking-[0.25em] uppercase mx-8 inline-flex items-center gap-3"
            >
              <span className="h-1 w-1 rounded-full bg-[#B8956A]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PRODUCTS SECTION
         ════════════════════════════════════════════════════════ */}
      <section ref={productsRef} className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-16">
            <span className="text-[#B8956A] text-[10px] tracking-[0.4em] uppercase">
              Explore
            </span>
            <h2 className="font-sans text-3xl md:text-4xl text-[#2C2C2C] mt-3">
              Our Collection
            </h2>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-16 bg-[#E8E4DE]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#B8956A]" />
              <div className="h-px w-16 bg-[#E8E4DE]" />
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-14">
            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 max-w-full">
              <button
                onClick={() => setActiveCategory("all")}
                className={`shrink-0 px-5 py-2.5 text-[11px] tracking-[0.12em] uppercase transition-all duration-300 ${
                  activeCategory === "all"
                    ? "bg-[#2C2C2C] text-[#FDFBF7]"
                    : "text-[#8C8477] hover:text-[#2C2C2C]"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-5 py-2.5 text-[11px] tracking-[0.12em] uppercase transition-all duration-300 ${
                    activeCategory === cat
                      ? "bg-[#2C2C2C] text-[#FDFBF7]"
                      : "text-[#8C8477] hover:text-[#2C2C2C]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8477]/50" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-[#E8E4DE] text-[#2C2C2C] pl-10 pr-5 py-2.5 text-sm w-56 focus:border-[#B8956A] focus:outline-none transition-colors duration-300 placeholder:text-[#8C8477]/40"
              />
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-[#F0EBE3] animate-pulse" />
                  <div className="h-4 w-2/3 bg-[#F0EBE3] animate-pulse" />
                  <div className="h-3 w-1/4 bg-[#F0EBE3] animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24">
              <Package className="h-14 w-14 mx-auto text-[#E8E4DE] mb-5" />
              <p className="font-sans text-xl text-[#8C8477]">
                {searchQuery || activeCategory !== "all"
                  ? "No products match your criteria"
                  : "No products available yet"}
              </p>
              {(searchQuery || activeCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-4 text-[#B8956A] text-sm underline underline-offset-4 hover:text-[#2C2C2C] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group">
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#F0EBE3] mb-5">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-16 w-16 text-[#DAD4CA] transition-colors duration-500 group-hover:text-[#B8956A]/30" />
                      </div>
                    )}

                    {/* Category label */}
                    {product.category && (
                      <div className="absolute top-4 left-4">
                        <span className="text-[9px] tracking-[0.18em] uppercase text-[#8C8477] bg-[#FDFBF7]/90 backdrop-blur-sm px-3 py-1.5">
                          {product.category.name}
                        </span>
                      </div>
                    )}

                    {/* Out of stock */}
                    {product.quantity_in_stock <= 0 && (
                      <div className="absolute inset-0 bg-[#FDFBF7]/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[#2C2C2C] text-[10px] tracking-[0.25em] uppercase border border-[#2C2C2C] px-5 py-2.5">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {/* Add to cart hover overlay */}
                    {product.quantity_in_stock > 0 && (
                      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-[#2C2C2C] text-[#FDFBF7] py-3.5 text-[11px] tracking-[0.18em] uppercase hover:bg-[#B8956A] transition-colors duration-300"
                        >
                          Add to Bag
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1.5">
                    <h3 className="font-sans text-[17px] text-[#2C2C2C] leading-snug">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-[#8C8477] text-[13px] line-clamp-1 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    <p className="text-[#B8956A] text-sm tracking-wide pt-0.5">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          VALUES SECTION
         ════════════════════════════════════════════════════════ */}
      <section className="border-t border-b border-[#E8E4DE] py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-14 px-6 text-center">
          <div>
            <div className="flex justify-center mb-5">
              <div className="h-12 w-12 rounded-full border border-[#E8E4DE] flex items-center justify-center">
                <Truck className="h-5 w-5 text-[#B8956A]" />
              </div>
            </div>
            <h3 className="font-sans text-lg text-[#2C2C2C] mb-2">
              Free Shipping
            </h3>
            <p className="text-[#8C8477] text-sm leading-relaxed">
              Complimentary shipping on all orders over $50, delivered with
              care.
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-5">
              <div className="h-12 w-12 rounded-full border border-[#E8E4DE] flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#B8956A]" />
              </div>
            </div>
            <h3 className="font-sans text-lg text-[#2C2C2C] mb-2">
              Quality Guarantee
            </h3>
            <p className="text-[#8C8477] text-sm leading-relaxed">
              Every product is vetted for exceptional quality and timeless
              craftsmanship.
            </p>
          </div>
          <div>
            <div className="flex justify-center mb-5">
              <div className="h-12 w-12 rounded-full border border-[#E8E4DE] flex items-center justify-center">
                <Headphones className="h-5 w-5 text-[#B8956A]" />
              </div>
            </div>
            <h3 className="font-sans text-lg text-[#2C2C2C] mb-2">
              Dedicated Support
            </h3>
            <p className="text-[#8C8477] text-sm leading-relaxed">
              Our team is here to help with anything you need, Monday through
              Friday.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          NEWSLETTER SECTION
         ════════════════════════════════════════════════════════ */}
      <section className="bg-[#2C2C2C] py-24 md:py-28">
        <div className="max-w-xl mx-auto text-center px-6">
          <span className="text-[#B8956A] text-[10px] tracking-[0.4em] uppercase">
            Newsletter
          </span>
          <h2 className="font-sans text-3xl md:text-4xl text-[#FDFBF7] mt-3 mb-4">
            Stay in the Know
          </h2>
          <p className="text-[#FDFBF7]/35 text-sm mb-10 leading-relaxed">
            Be the first to discover new arrivals, exclusive offers, and
            curated collections delivered to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Thanks for subscribing!", {
                style: {
                  background: "#2C2C2C",
                  color: "#FDFBF7",
                  border: "1px solid #B8956A",
                  fontSize: "13px",
                },
              });
              (e.target as HTMLFormElement).reset();
            }}
            className="flex flex-col sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 bg-transparent border border-[#FDFBF7]/15 text-[#FDFBF7] px-5 py-4 text-sm focus:border-[#B8956A] focus:outline-none transition-colors duration-300 placeholder:text-[#FDFBF7]/20"
            />
            <button
              type="submit"
              className="bg-[#B8956A] text-[#FDFBF7] px-10 py-4 text-xs tracking-[0.18em] uppercase hover:bg-[#C9A67B] transition-colors duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FLOATING CART BUTTON
         ════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-[#2C2C2C] text-[#FDFBF7] h-14 w-14 rounded-full shadow-2xl hover:bg-[#B8956A] transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        aria-label="Open shopping bag"
      >
        <ShoppingBag className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#B8956A] text-[#FDFBF7] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* ════════════════════════════════════════════════════════
          CART SHEET
         ════════════════════════════════════════════════════════ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md !bg-[#FDFBF7] flex flex-col !p-0">
          <SheetHeader className="px-6 pt-6 pb-0">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C8477] block mb-1">
              Your Bag
            </span>
            <SheetTitle className="font-sans text-2xl text-[#2C2C2C] !font-normal">
              Shopping Bag ({cartCount})
            </SheetTitle>
          </SheetHeader>

          <div className="h-px bg-[#E8E4DE] mx-6 mt-4" />

          <ScrollArea className="flex-1 px-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="h-12 w-12 mb-4 text-[#E8E4DE]" />
                <p className="font-sans text-lg text-[#8C8477]">
                  Your bag is empty
                </p>
                <p className="text-sm mt-1.5 text-[#8C8477]/50">
                  Explore our collection to find something you love
                </p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="py-6 flex gap-4 border-b border-[#E8E4DE] last:border-b-0"
                  >
                    {/* Thumbnail */}
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#F0EBE3] flex items-center justify-center">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-[#DAD4CA]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-sans text-sm text-[#2C2C2C] leading-snug">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="shrink-0 text-[#8C8477] hover:text-[#2C2C2C] transition-colors"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[#B8956A] text-sm mt-1.5">
                        ${(item.product.price * item.qty).toFixed(2)}
                      </p>
                      <div className="flex items-center mt-3 border border-[#E8E4DE] w-fit">
                        <button
                          className="px-3 py-2 hover:bg-[#F0EBE3] transition-colors"
                          onClick={() => updateQty(item.product.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3 text-[#8C8477]" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium text-[#2C2C2C]">
                          {item.qty}
                        </span>
                        <button
                          className="px-3 py-2 hover:bg-[#F0EBE3] transition-colors"
                          onClick={() => updateQty(item.product.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3 text-[#8C8477]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {cart.length > 0 && (
            <SheetFooter className="!p-6 border-t border-[#E8E4DE] mt-auto">
              <div className="w-full space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#8C8477]">
                    Subtotal
                  </span>
                  <span className="font-sans text-xl text-[#2C2C2C]">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8C8477]/50">
                  Shipping and taxes calculated at checkout.
                </p>
                <button
                  className="w-full bg-[#2C2C2C] text-[#FDFBF7] py-4 text-xs tracking-[0.18em] uppercase hover:bg-[#B8956A] transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={cart.length === 0 || isCheckingOut}
                  onClick={handleCheckout}
                >
                  {isCheckingOut ? (
                    "Processing..."
                  ) : (
                    <>
                      Checkout
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
