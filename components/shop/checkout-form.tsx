"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Truck, Banknote, CreditCard, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { formatLKR, effectivePrice } from "@/lib/format";
import { computeDeliveryFee } from "@/lib/delivery";
import { STORE_SETTINGS } from "@/lib/settings";
import type { DeliveryZone } from "@/lib/types";

interface Props {
  zones: DeliveryZone[];
  prefillEmail: string | null;
  prefillName: string | null;
}

type PaymentMethod = "cod" | "bank_transfer";

export function CheckoutForm({ zones, prefillEmail, prefillName }: Props) {
  const router = useRouter();
  const { items, loading: cartLoading } = useCart();

  const [email, setEmail] = useState(prefillEmail ?? "");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState(prefillName ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);

  const zone = zones.find((z) => z.city === city) ?? null;
  const district = zone?.district ?? "";

  const subtotal = useMemo(
    () =>
      items.reduce((sum, line) => {
        const p = line.product;
        if (!p) return sum;
        return sum + effectivePrice(p.price, p.discount_pct ?? 0) * line.quantity;
      }, 0),
    [items]
  );

  const deliveryFee = zone
    ? computeDeliveryFee(
        Number(zone.delivery_fee),
        subtotal,
        STORE_SETTINGS.freeDeliveryThresholdLKR
      )
    : 0;
  const total = subtotal + deliveryFee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!zone) {
      toast.error("Select your city");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { email, phone, full_name: fullName },
          shipping: {
            line1,
            line2: line2 || null,
            city,
            district,
            postal_code: postal || null,
            notes: notes || null,
          },
          payment_method: method,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Checkout failed");
      }
      const { order_id } = await res.json();
      window.dispatchEvent(new Event("cart:change"));
      router.push(`/order?id=${order_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8"
    >
      <div className="space-y-6">
        {/* Contact */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Full name"
              required
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
            />
            <Field
              label="Phone"
              required
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              type="tel"
              placeholder="0771234567"
            />
            <Field
              label="Email"
              required
              value={email}
              onChange={setEmail}
              autoComplete="email"
              type="email"
              className="sm:col-span-2"
            />
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Shipping address</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Address line 1"
              required
              value={line1}
              onChange={setLine1}
              autoComplete="address-line1"
              className="sm:col-span-2"
            />
            <Field
              label="Address line 2 (optional)"
              value={line2}
              onChange={setLine2}
              autoComplete="address-line2"
              className="sm:col-span-2"
            />
            <div>
              <label className="text-sm block mb-1">
                City <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Select city</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.city}>
                    {z.city} ({z.district})
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Postal code (optional)"
              value={postal}
              onChange={setPostal}
              autoComplete="postal-code"
            />
            <div className="sm:col-span-2">
              <label className="text-sm block mb-1">Delivery notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Landmark, building name, gate code, etc."
              />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Payment method</h2>
          <div className="space-y-2">
            <PaymentOption
              selected={method === "cod"}
              onClick={() => setMethod("cod")}
              icon={<Truck className="h-5 w-5" />}
              title="Cash on delivery"
              desc="Pay in cash when your order arrives"
            />
            <PaymentOption
              selected={method === "bank_transfer"}
              onClick={() => setMethod("bank_transfer")}
              icon={<Banknote className="h-5 w-5" />}
              title="Bank transfer"
              desc={`Transfer to ${STORE_SETTINGS.bankName} — instructions shown after order`}
            />
            <PaymentOption
              disabled
              icon={<CreditCard className="h-5 w-5" />}
              title="Card / online payment"
              desc="Coming soon"
            />
          </div>
        </section>
      </div>

      <aside className="rounded-lg border border-border bg-card p-5 h-fit lg:sticky lg:top-20">
        <h2 className="font-display text-lg font-bold mb-4">Order summary</h2>
        {cartLoading ? (
          <p className="text-sm text-muted-foreground">Loading cart...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {items.map((line) => {
                const p = line.product;
                if (!p) return null;
                const unit = effectivePrice(p.price, p.discount_pct ?? 0);
                return (
                  <li key={line.id} className="flex justify-between text-sm">
                    <span className="line-clamp-1 pr-2">
                      {p.name}{" "}
                      <span className="text-muted-foreground">× {line.quantity}</span>
                    </span>
                    <span className="tabular-nums shrink-0">
                      {formatLKR(unit * line.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="h-px bg-border mb-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatLKR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">
                  {!zone ? (
                    "Select city"
                  ) : deliveryFee === 0 ? (
                    <span className="text-success">FREE</span>
                  ) : (
                    formatLKR(deliveryFee)
                  )}
                </dd>
              </div>
            </dl>
            <div className="h-px bg-border my-4" />
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold tabular-nums">{formatLKR(total)}</span>
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={submitting || items.length === 0 || !zone}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            "Placing order..."
          ) : (
            <>
              Place order
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  className = "",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm block mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

function PaymentOption({
  selected,
  onClick,
  disabled,
  icon,
  title,
  desc,
}: {
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full text-left flex items-start gap-3 p-4 rounded-md border transition-colors ${
        disabled
          ? "border-border opacity-50 cursor-not-allowed"
          : selected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
      }`}
    >
      <span className="shrink-0 mt-0.5 text-primary">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground mt-0.5">{desc}</span>
      </span>
    </button>
  );
}
