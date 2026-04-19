"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { DeliveryZone } from "@/lib/types";

interface Draft {
  city: string;
  district: string;
  est_min_days: number;
  est_max_days: number;
  delivery_fee: number;
}

function zoneToDraft(z: DeliveryZone): Draft {
  return {
    city: z.city,
    district: z.district,
    est_min_days: z.est_min_days,
    est_max_days: z.est_max_days,
    delivery_fee: z.delivery_fee,
  };
}

function draftsEqual(a: Draft, b: Draft): boolean {
  return (
    a.city === b.city &&
    a.district === b.district &&
    a.est_min_days === b.est_min_days &&
    a.est_max_days === b.est_max_days &&
    a.delivery_fee === b.delivery_fee
  );
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newZone, setNewZone] = useState<Draft>({
    city: "",
    district: "",
    est_min_days: 1,
    est_max_days: 3,
    delivery_fee: 0,
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/delivery-zones");
    const json = await res.json();
    const items = (json.zones ?? []) as DeliveryZone[];
    setZones(items);
    const d: Record<string, Draft> = {};
    for (const z of items) d[z.id] = zoneToDraft(z);
    setDrafts(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  const isDirty = (z: DeliveryZone): boolean => {
    const draft = drafts[z.id];
    if (!draft) return false;
    return !draftsEqual(draft, zoneToDraft(z));
  };

  const saveRow = async (z: DeliveryZone) => {
    const draft = drafts[z.id];
    if (!draft) return;
    if (!draft.city.trim() || !draft.district.trim()) {
      toast.error("City and district required");
      return;
    }
    setSavingId(z.id);
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: z.id,
          city: draft.city.trim(),
          district: draft.district.trim(),
          est_min_days: Number(draft.est_min_days),
          est_max_days: Number(draft.est_max_days),
          delivery_fee: Number(draft.delivery_fee),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      toast.success("Zone updated");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const revert = (z: DeliveryZone) => {
    updateDraft(z.id, zoneToDraft(z));
  };

  const remove = async (z: DeliveryZone) => {
    if (!confirm(`Delete ${z.city} (${z.district})?`)) return;
    const res = await fetch(`/api/admin/delivery-zones?id=${z.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Zone deleted");
      void load();
    } else {
      const j = await res.json();
      toast.error(j.error || "Delete failed");
    }
  };

  const createZone = async () => {
    if (!newZone.city.trim() || !newZone.district.trim()) {
      toast.error("City and district required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: newZone.city.trim(),
          district: newZone.district.trim(),
          est_min_days: Number(newZone.est_min_days),
          est_max_days: Number(newZone.est_max_days),
          delivery_fee: Number(newZone.delivery_fee),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      toast.success("Zone created");
      setAddOpen(false);
      setNewZone({ city: "", district: "", est_min_days: 1, est_max_days: 3, delivery_fee: 0 });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery zones</h1>
          <p className="text-muted-foreground">Cities, delivery estimates, and fees</p>
        </div>
        <Button onClick={() => setAddOpen((o) => !o)}>
          <Plus className="mr-1 h-4 w-4" />
          Add zone
        </Button>
      </div>

      {addOpen && (
        <div className="rounded-md border bg-background p-4">
          <h2 className="mb-3 text-sm font-semibold">New zone</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="space-y-1">
              <Label htmlFor="nz-city">City</Label>
              <Input
                id="nz-city"
                value={newZone.city}
                onChange={(e) => setNewZone((z) => ({ ...z, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nz-district">District</Label>
              <Input
                id="nz-district"
                value={newZone.district}
                onChange={(e) => setNewZone((z) => ({ ...z, district: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nz-min">Min days</Label>
              <Input
                id="nz-min"
                type="number"
                min={0}
                value={newZone.est_min_days}
                onChange={(e) => setNewZone((z) => ({ ...z, est_min_days: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nz-max">Max days</Label>
              <Input
                id="nz-max"
                type="number"
                min={0}
                value={newZone.est_max_days}
                onChange={(e) => setNewZone((z) => ({ ...z, est_max_days: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nz-fee">Fee (Rs)</Label>
              <Input
                id="nz-fee"
                type="number"
                min={0}
                value={newZone.delivery_fee}
                onChange={(e) => setNewZone((z) => ({ ...z, delivery_fee: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createZone} disabled={creating}>
              {creating ? "Creating..." : "Create zone"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>District</TableHead>
              <TableHead className="w-[110px]">Min days</TableHead>
              <TableHead className="w-[110px]">Max days</TableHead>
              <TableHead className="w-[130px]">Fee (Rs)</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No delivery zones yet.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((z) => {
                const draft = drafts[z.id] ?? zoneToDraft(z);
                const dirty = isDirty(z);
                return (
                  <TableRow key={z.id}>
                    <TableCell>
                      <Input
                        value={draft.city}
                        onChange={(e) => updateDraft(z.id, { city: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.district}
                        onChange={(e) => updateDraft(z.id, { district: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={draft.est_min_days}
                        onChange={(e) => updateDraft(z.id, { est_min_days: Number(e.target.value) })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={draft.est_max_days}
                        onChange={(e) => updateDraft(z.id, { est_max_days: Number(e.target.value) })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={draft.delivery_fee}
                        onChange={(e) => updateDraft(z.id, { delivery_fee: Number(e.target.value) })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={!dirty || savingId === z.id}
                          onClick={() => saveRow(z)}
                          title="Save"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        {dirty && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => revert(z)}
                            title="Revert"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => remove(z)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
