"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderItemsEditor, type OrderLineItem } from "./order-items-editor";
import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/lib/types";
import toast from "react-hot-toast";

interface OrderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "type" | "items" | "review";

export function OrderWizard({ open, onOpenChange, onSuccess }: OrderWizardProps) {
  const [step, setStep] = useState<Step>("type");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [orderType, setOrderType] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderLineItem[]>([]);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((j) => setSuppliers(j.data || []));
  }, []);

  const canProceedFromType = !!orderType;
  const canProceedFromItems = items.length > 0 && items.every((i) => i.quantity > 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body = {
        type: orderType,
        supplier_id: supplierId || null,
        reference_number: referenceNumber || null,
        notes: notes || null,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      toast.success("Order created");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            New Order
            {step !== "type" && (
              <Badge variant="outline" className="ml-2 capitalize">
                {orderType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Type */}
        {step === "type" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound (Receiving Stock)</SelectItem>
                  <SelectItem value="outbound">Outbound (Shipping Stock)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === "inbound" && (
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="PO-001, INV-123, etc."
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Items */}
        {step === "items" && (
          <OrderItemsEditor
            items={items}
            onChange={setItems}
            orderType={orderType}
          />
        )}

        {/* Step 3: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge className="capitalize">{orderType}</Badge>
              </div>
              {referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span>{referenceNumber}</span>
                </div>
              )}
              {supplierId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span>{suppliers.find((s) => s.id === supplierId)?.name ?? "—"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span>{items.length} product(s)</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Value:</span>
                <span>
                  ${items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toFixed(2)}
                </span>
              </div>
            </div>
            {notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes: </span>
                {notes}
              </div>
            )}
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id} className="border-b last:border-0">
                      <td className="px-3 py-2">{item.product_name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step !== "type" && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStep(step === "review" ? "items" : "type")
              }
            >
              Back
            </Button>
          )}
          {step === "type" && (
            <Button
              disabled={!canProceedFromType}
              onClick={() => setStep("items")}
            >
              Next: Add Items
            </Button>
          )}
          {step === "items" && (
            <Button
              disabled={!canProceedFromItems}
              onClick={() => setStep("review")}
            >
              Next: Review
            </Button>
          )}
          {step === "review" && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
