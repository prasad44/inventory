import { BadgeCheck, Truck, Shield, Banknote } from "lucide-react";

const PROPS = [
  {
    icon: BadgeCheck,
    title: "Genuine stock",
    sub: "Authorized distributors only",
  },
  {
    icon: Truck,
    title: "Islandwide delivery",
    sub: "1-6 days to anywhere in Sri Lanka",
  },
  {
    icon: Shield,
    title: "Warranty backed",
    sub: "12-24 month manufacturer warranty",
  },
  {
    icon: Banknote,
    title: "Cash on delivery",
    sub: "Pay when you receive",
  },
];

export function ValuePropsStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PROPS.map((p) => (
          <div
            key={p.title}
            className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
              <p.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{p.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{p.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
