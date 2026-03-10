"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

export interface OrderLineItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  current_stock: number;
}

interface OrderItemsEditorProps {
  items: OrderLineItem[];
  onChange: (items: OrderLineItem[]) => void;
  orderType: string;
}

export function OrderItemsEditor({ items, onChange, orderType }: OrderItemsEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products?pageSize=1000")
      .then((r) => r.json())
      .then((j) => setProducts(j.data || []));
  }, []);

  const addItem = (product: Product) => {
    if (items.some((i) => i.product_id === product.id)) {
      setSearchOpen(false);
      return;
    }
    onChange([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: orderType === "inbound" ? Number(product.cost_price) : Number(product.price),
        current_stock: product.quantity_in_stock,
      },
    ]);
    setSearchOpen(false);
  };

  const updateItem = (index: number, field: keyof OrderLineItem, value: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Order Items</h4>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add Product
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search products..." />
              <CommandList>
                <CommandEmpty>No products found.</CommandEmpty>
                <CommandGroup>
                  {products.map((p) => (
                    <CommandItem
                      key={p.id}
                      onSelect={() => addItem(p)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.sku} — Stock: {p.quantity_in_stock}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {items.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[100px]">Qty</TableHead>
                <TableHead className="w-[120px]">Unit Price</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.product_id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{item.product_sku}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.current_stock}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 w-28"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {items.length > 0 && (
        <div className="text-right text-sm font-medium">
          Total: ${items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toFixed(2)}
        </div>
      )}
    </div>
  );
}
