"use client";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSpecsSchema, type SpecField } from "@/lib/specs-schema";

interface Props {
  categorySlug: string | null | undefined;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function SpecsEditor({ categorySlug, value, onChange }: Props) {
  const schema = useMemo(() => getSpecsSchema(categorySlug), [categorySlug]);

  function setField(key: string, v: unknown) {
    const next = { ...value };
    if (v === "" || v === null || v === undefined) {
      delete next[key];
    } else {
      next[key] = v;
    }
    onChange(next);
  }

  if (schema.length === 0) {
    return <FreeformEditor value={value} onChange={onChange} />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {schema.map((f) => (
        <SpecFieldInput
          key={f.key}
          field={f}
          value={value[f.key]}
          onChange={(v) => setField(f.key, v)}
        />
      ))}
    </div>
  );
}

function SpecFieldInput({
  field,
  value,
  onChange,
}: {
  field: SpecField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm pt-5">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        {field.label}
      </label>
    );
  }
  return (
    <div>
      <Label htmlFor={`spec-${field.key}`} className="text-xs">
        {field.label}
      </Label>
      <Input
        id={`spec-${field.key}`}
        type={field.type === "number" ? "number" : "text"}
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(
            field.type === "number"
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value
          )
        }
        placeholder={field.hint}
        className="mt-1"
      />
    </div>
  );
}

function FreeformEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const entries = Object.entries(value).filter(([k]) => !k.startsWith("calculator_"));
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  function addRow() {
    const k = newKey.trim();
    if (!k) return;
    onChange({ ...value, [k]: newValue });
    setNewKey("");
    setNewValue("");
  }

  function removeRow(key: string) {
    const next = { ...value };
    delete next[key];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select a category with a spec template, or add key/value pairs below.
        </p>
      )}
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[160px,1fr,auto] gap-2 items-center">
          <Input value={k} readOnly className="font-mono text-xs" />
          <Input
            value={String(v ?? "")}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })}
          />
          <button
            type="button"
            onClick={() => removeRow(k)}
            aria-label={`Remove ${k}`}
            className="p-1.5 rounded hover:bg-muted text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[160px,1fr,auto] gap-2 items-center">
        <Input
          placeholder="spec_key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="font-mono text-xs"
        />
        <Input
          placeholder="value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button
          type="button"
          onClick={addRow}
          disabled={!newKey.trim()}
          aria-label="Add spec row"
          className="p-1.5 rounded hover:bg-muted disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
