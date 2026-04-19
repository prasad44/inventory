function prettyKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function prettyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SpecsTable({ specs }: { specs: Record<string, unknown> }) {
  // Skip internal keys like `calculator_meta` which are for widgets, not display
  const entries = Object.entries(specs).filter(([k]) => !k.startsWith("calculator_"));
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No specifications available.</p>;
  }
  return (
    <table className="w-full max-w-2xl text-sm">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-b border-border last:border-b-0">
            <th scope="row" className="py-2 pr-4 text-left font-medium text-muted-foreground w-1/3">
              {prettyKey(k)}
            </th>
            <td className="py-2">{prettyValue(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
