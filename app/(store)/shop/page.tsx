"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  Plus, 
  Minus, 
  X,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetch("/api/products?status=active")
      .then(r => r.json())
      .then(j => {
        setProducts(j.data || []);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success("Added to bag");
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
  };

  const subtotal = cart.reduce((sum, i) => sum + (i.product.price * i.qty), 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({
            product_id: i.product.id,
            quantity: i.qty,
            unit_price: i.product.price
          }))
        })
      });

      if (res.ok) {
        setIsCheckoutSuccess(true);
        setCart([]);
      } else {
        const data = await res.json();
        toast.error(data.error || "Checkout failed");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isCheckoutSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-slate-600 mb-8">
          Thank you for your purchase. Your order has been placed and inventory has been updated.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => setIsCheckoutSuccess(false)}>Continue Shopping</Button>
          <Link href="/">
             <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Featured Products</h1>
          <p className="text-slate-500">Premium tech essentials for your daily workflow.</p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="h-12 px-6 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all active:scale-95">
              <ShoppingBag className="h-5 w-5" />
              Cart ({cartCount})
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="pb-6">
              <SheetTitle className="flex items-center gap-2">
                 <ShoppingBag className="h-5 w-5" />
                 Your Bag
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                  <p>Your bag is empty</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.product.id} className="py-6 flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between font-medium text-slate-900">
                           <h3>{item.product.name}</h3>
                           <p className="ml-4">${(item.product.price * item.qty).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-1">{item.product.description || "No description available"}</p>
                        <div className="mt-4 flex items-center justify-between">
                           <div className="flex items-center border rounded-md">
                              <button className="p-1 hover:bg-slate-50" onClick={() => updateQty(item.product.id, -1)}><Minus className="h-3 w-3" /></button>
                              <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                              <button className="p-1 hover:bg-slate-50" onClick={() => updateQty(item.product.id, 1)}><Plus className="h-3 w-3" /></button>
                           </div>
                           <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500" onClick={() => removeFromCart(item.product.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <SheetFooter className="pt-6 border-t mt-auto">
               <div className="w-full space-y-4">
                  <div className="flex justify-between text-base font-medium text-slate-900">
                    <p>Subtotal</p>
                    <p>${subtotal.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-slate-500">Shipping and taxes calculated at checkout.</p>
                  <Button 
                    className="w-full h-14 text-lg font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg" 
                    disabled={cart.length === 0 || isCheckingOut}
                    onClick={handleCheckout}
                  >
                    {isCheckingOut ? "Processing..." : (
                       <>
                        Checkout <ArrowRight className="h-5 w-5" />
                       </>
                    )}
                  </Button>
               </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-4">
               <div className="aspect-square bg-slate-200 animate-pulse rounded-2xl" />
               <div className="h-4 w-2/3 bg-slate-200 animate-pulse rounded" />
               <div className="h-4 w-1/4 bg-slate-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <Card key={product.id} className="group border-none bg-transparent shadow-none">
              <CardContent className="p-0 space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 transition-colors group-hover:bg-slate-100">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <Package className="h-20 w-20 text-slate-200 group-hover:text-indigo-100 transition-colors" />
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                     <Badge variant="secondary" className="bg-white/90 backdrop-blur text-indigo-700 font-bold">
                        ${Number(product.price).toFixed(2)}
                     </Badge>
                  </div>
                  {product.quantity_in_stock <= 0 && (
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge variant="destructive" className="px-4 py-1 text-sm uppercase tracking-widest">Out of Stock</Badge>
                     </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-xl"
                      disabled={product.quantity_in_stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      Add to Bag
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{product.description || "Premium design meets functional engineering."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
