"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Loader2,
  PackageSearch,
  CheckCircle2,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/types";
import toast from "react-hot-toast";
import { useBarcodeScanner } from "@/lib/hooks/use-barcode-scanner";
import { BarcodeScannerDialog } from "@/components/barcode/barcode-scanner-dialog";

interface CartItem extends Product {
  cartQuantity: number;
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "processing" | "success">("idle");
  const [cameraOpen, setCameraOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scan from hardware scanner or camera
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(barcode)}&pageSize=8`);
      const json = await res.json();
      const results: Product[] = json.data || [];

      // Check for exact barcode match
      const exactMatch = results.find(
        (p) => p.barcode?.toLowerCase() === barcode.toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        toast.success(`Added ${exactMatch.name}`);
      } else if (results.length > 0) {
        // Populate search with the results
        setSearch(barcode);
        setProducts(results);
        searchInputRef.current?.focus();
      } else {
        toast.error(`No product found for barcode: ${barcode}`);
      }
    } catch {
      toast.error("Failed to look up barcode");
    }
  }, []);

  // Hardware USB/Bluetooth barcode scanner detection
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: checkoutStatus === "idle",
  });

  // Focus search on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search products
  useEffect(() => {
    if (search.length < 2) {
      setProducts([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products?search=${search}&pageSize=8`);
        const json = await res.json();
        setProducts(json.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const addToCart = (product: Product) => {
    if (product.quantity_in_stock <= 0) {
      toast.error("Item out of stock");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity_in_stock) {
          toast.error("Cannot add more than available stock");
          return prev;
        }
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    
    // Clear search and refocus
    setSearch("");
    setProducts([]);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty > item.quantity_in_stock) {
          toast.error("Max stock reached");
          return item;
        }
        return newQty > 0 ? { ...item, cartQuantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const tax = subtotal * 0.08; // 8% placeholder
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setCheckoutStatus("processing");
    try {
      // 1. Create the Order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "outbound",
          notes: "POS Sale",
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.cartQuantity,
            unit_price: item.price
          }))
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");

      // 2. Complete the Order to reduce stock
      const completeRes = await fetch(`/api/orders/${json.data.id}/complete`, {
        method: "POST"
      });
      
      if (!completeRes.ok) {
        const completeJson = await completeRes.json();
        throw new Error(completeJson.error || "Failed to finalize stock reduction");
      }

      setCheckoutStatus("success");
      setCart([]);
      toast.success("Sale completed successfully!");
      
      // Reset after 3 seconds
      setTimeout(() => setCheckoutStatus("idle"), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setCheckoutStatus("idle");
    }
  };

  if (checkoutStatus === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95">
        <div className="rounded-full bg-emerald-100 p-6 mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Sale Completed!</h2>
        <p className="text-muted-foreground mb-8">Stock has been updated automatically.</p>
        <Button size="lg" onClick={() => setCheckoutStatus("idle")}>
          Start New Sale
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Product Selection Area */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Scan barcode or type product name/SKU..."
                  className="pl-10 h-12 text-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setCameraOpen(true)}
                title="Scan barcode with camera"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 border-t">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col text-left border rounded-xl p-0 hover:bg-accent transition-colors group relative overflow-hidden"
                  >
                    <div className="aspect-video w-full bg-muted relative overflow-hidden">
                       {product.image_url ? (
                         <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                       ) : (
                         <div className="h-full w-full flex items-center justify-center">
                            <PackageSearch className="h-8 w-8 text-muted-foreground/20" />
                         </div>
                       )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm mb-0.5 truncate w-full">{product.name}</div>
                      <div className="text-[10px] text-muted-foreground mb-2">{product.sku}</div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-primary text-sm">${Number(product.price).toFixed(2)}</div>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {product.quantity_in_stock}
                        </Badge>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                          <Plus className="h-6 w-6" />
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <PackageSearch className="h-12 w-12 mb-4 opacity-20" />
                <p>No products found matching "{search}"</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <ShoppingCart className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Search for products to start a sale</p>
                <p className="text-xs opacity-70">Type at least 2 characters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart Area */}
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col shadow-lg border-primary/20">
          <CardHeader className="bg-primary/5 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Current Sale
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground mt-10">
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex gap-3 animate-in slide-in-from-right-2">
                      <div className="h-10 w-10 rounded border bg-muted overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <PackageSearch className="h-4 w-4 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-xs leading-tight line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">${Number(item.price).toFixed(2)} each</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center border rounded-md h-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold">{item.cartQuantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 bg-muted/30 space-y-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button 
              className="w-full h-14 text-lg font-bold gap-2" 
              size="lg"
              disabled={cart.length === 0 || checkoutStatus === "processing"}
              onClick={handleCheckout}
            >
              {checkoutStatus === "processing" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              Complete Payment
            </Button>
          </CardFooter>
        </Card>
      </div>

      <BarcodeScannerDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}
