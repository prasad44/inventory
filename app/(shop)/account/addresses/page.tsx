"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Trash2, Pencil, Plus, Check } from "lucide-react";
import type { Address } from "@/lib/types";

type FormState = Partial<Address>;

export default function AddressesPage() {
  const [items, setItems] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);

  function refetch() {
    setItems(null);
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((j) => setItems((j.addresses ?? []) as Address[]))
      .catch(() => setItems([]));
  }

  useEffect(refetch, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const method = editing.id ? "PATCH" : "POST";
    const res = await fetch("/api/account/addresses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Could not save");
      return;
    }
    toast.success(editing.id ? "Updated" : "Added");
    setEditing(null);
    refetch();
  }

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(
      `/api/account/addresses?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Deleted");
      refetch();
    } else {
      toast.error("Could not delete");
    }
  }

  if (items === null) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {editing && (
        <form
          onSubmit={submit}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <h3 className="font-medium">
            {editing.id ? "Edit address" : "Add address"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <Field
              label="Full name"
              value={editing.full_name}
              onChange={(v) => setEditing({ ...editing, full_name: v })}
              required
            />
            <Field
              label="Phone"
              value={editing.phone}
              onChange={(v) => setEditing({ ...editing, phone: v })}
              required
            />
            <Field
              label="Line 1"
              value={editing.line1}
              onChange={(v) => setEditing({ ...editing, line1: v })}
              required
              className="sm:col-span-2"
            />
            <Field
              label="Line 2"
              value={editing.line2 ?? ""}
              onChange={(v) => setEditing({ ...editing, line2: v })}
              className="sm:col-span-2"
            />
            <Field
              label="City"
              value={editing.city}
              onChange={(v) => setEditing({ ...editing, city: v })}
              required
            />
            <Field
              label="District"
              value={editing.district}
              onChange={(v) => setEditing({ ...editing, district: v })}
              required
            />
            <Field
              label="Postal code"
              value={editing.postal_code ?? ""}
              onChange={(v) => setEditing({ ...editing, postal_code: v })}
            />
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={!!editing.is_default}
                onChange={(e) =>
                  setEditing({ ...editing, is_default: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              Set as default
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-1.5 rounded-md border border-border text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add address
        </button>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-medium">No addresses yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add a shipping address to speed up checkout.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {a.full_name}
                    {a.is_default && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-primary">
                        <Check className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground">{a.phone}</div>
                  <div className="mt-1">
                    {a.line1}
                    {a.line2 && `, ${a.line2}`}
                  </div>
                  <div className="text-muted-foreground">
                    {a.city}, {a.district}
                    {a.postal_code && ` · ${a.postal_code}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(a)}
                    aria-label="Edit"
                    className="p-1.5 rounded hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    aria-label="Delete"
                    className="p-1.5 rounded hover:bg-muted text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  className = "",
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <input
        type="text"
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}
