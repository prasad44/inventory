"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoreSettingsRow {
  id: number;
  wa_number: string | null;
  free_delivery_threshold: number | string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  updated_at: string;
}

type FormState = {
  wa_number: string;
  free_delivery_threshold: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
};

const EMPTY: FormState = {
  wa_number: "",
  free_delivery_threshold: "5000",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_branch: "",
};

export function StoreSettingsForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/store-settings")
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { settings: StoreSettingsRow | null };
        return json.settings;
      })
      .then((row) => {
        if (cancelled) return;
        if (row) {
          setForm({
            wa_number: row.wa_number ?? "",
            free_delivery_threshold: String(row.free_delivery_threshold ?? "5000"),
            bank_name: row.bank_name ?? "",
            bank_account_name: row.bank_account_name ?? "",
            bank_account_number: row.bank_account_number ?? "",
            bank_branch: row.bank_branch ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/store-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_number: form.wa_number.trim() || null,
          free_delivery_threshold: Number(form.free_delivery_threshold) || 0,
          bank_name: form.bank_name.trim() || null,
          bank_account_name: form.bank_account_name.trim() || null,
          bank_account_number: form.bank_account_number.trim() || null,
          bank_branch: form.bank_branch.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setMessage({ kind: "err", text: json?.error ?? "Failed to save settings" });
      } else {
        setMessage({ kind: "ok", text: "Settings saved" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Store settings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wa_number">WhatsApp number</Label>
                <Input
                  id="wa_number"
                  placeholder="+9477XXXXXXX"
                  value={form.wa_number}
                  onChange={(e) => update("wa_number", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for WhatsApp click-to-chat from product pages.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="free_delivery_threshold">Free delivery threshold (LKR)</Label>
                <Input
                  id="free_delivery_threshold"
                  type="number"
                  min="0"
                  step="100"
                  value={form.free_delivery_threshold}
                  onChange={(e) => update("free_delivery_threshold", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">Bank transfer details</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bank_name">Bank name</Label>
                  <Input
                    id="bank_name"
                    value={form.bank_name}
                    onChange={(e) => update("bank_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank_branch">Branch</Label>
                  <Input
                    id="bank_branch"
                    value={form.bank_branch}
                    onChange={(e) => update("bank_branch", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank_account_name">Account name</Label>
                  <Input
                    id="bank_account_name"
                    value={form.bank_account_name}
                    onChange={(e) => update("bank_account_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank_account_number">Account number</Label>
                  <Input
                    id="bank_account_number"
                    value={form.bank_account_number}
                    onChange={(e) => update("bank_account_number", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </Button>
              {message && (
                <span
                  className={
                    message.kind === "ok"
                      ? "text-sm text-green-600"
                      : "text-sm text-red-600"
                  }
                >
                  {message.text}
                </span>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
