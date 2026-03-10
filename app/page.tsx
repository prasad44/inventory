import Link from "next/link";
import {
  Package,
  ArrowRight,
  BarChart3,
  ScanLine,
  ShoppingCart,
  Truck,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track every product across warehouses with real-time stock levels, SKU management, and automated reorder alerts.",
    accent: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-600",
  },
  {
    icon: ScanLine,
    title: "Point of Sale",
    description:
      "Process retail transactions instantly with barcode scanning, cart management, and automatic stock deductions.",
    accent: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-600",
  },
  {
    icon: ShoppingCart,
    title: "Order Tracking",
    description:
      "Manage inbound, outbound, and adjustment orders with full lifecycle tracking from creation to completion.",
    accent: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-600",
  },
  {
    icon: Truck,
    title: "Supplier Hub",
    description:
      "Maintain a complete supplier directory with contact details, order history, and performance insights.",
    accent: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-600",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<50ms", label: "Response Time" },
  { value: "256-bit", label: "Encryption" },
  { value: "24/7", label: "Support" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-foreground">
              Stock<span className="text-primary">Up</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security
            </a>
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5 shadow-sm">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Now with real-time stock sync
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                Inventory control{" "}
                <span className="text-primary">built for speed</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                From warehouse to checkout counter — manage products, process sales,
                track orders, and coordinate suppliers in one unified platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login">
                  <Button size="lg" className="gap-2 shadow-md text-base px-6 w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 text-base px-6 w-full sm:w-auto"
                  >
                    View Dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  14-day free trial
                </span>
              </div>
            </div>

            {/* Right column — Dashboard mockup */}
            <div className="relative lg:pl-4">
              <div className="relative rounded-xl border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-muted rounded-md px-12 py-1 text-[10px] text-muted-foreground font-mono">
                      stockup.app/dashboard
                    </div>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="p-4 space-y-4 bg-muted/10">
                  {/* Stat cards row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Products", value: "1,247", change: "+12%", color: "text-blue-600" },
                      { label: "Low Stock", value: "23", change: "-5%", color: "text-amber-600" },
                      { label: "Value", value: "$84.2K", change: "+8%", color: "text-emerald-600" },
                      { label: "Orders", value: "47", change: "+24%", color: "text-violet-600" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border bg-card p-2.5 space-y-1"
                      >
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="text-sm font-bold">{stat.value}</p>
                        <p className={`text-[9px] font-medium ${stat.color}`}>
                          {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart area + alerts */}
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3 rounded-lg border bg-card p-3">
                      <p className="text-[9px] text-muted-foreground font-medium mb-2">
                        STOCK MOVEMENT
                      </p>
                      {/* Fake bar chart */}
                      <div className="flex items-end gap-1.5 h-20">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-sm bg-primary/20"
                              style={{ height: `${h}%` }}
                            >
                              <div
                                className="w-full rounded-sm bg-primary/60"
                                style={{ height: `${Math.max(30, h - 20)}%` }}
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 rounded-lg border bg-card p-3 space-y-2">
                      <p className="text-[9px] text-muted-foreground font-medium">
                        ALERTS
                      </p>
                      {[
                        "Widget A — 3 left",
                        "Sensor B — 7 left",
                        "Cable C — 2 left",
                      ].map((alert) => (
                        <div
                          key={alert}
                          className="flex items-center gap-1.5 text-[9px]"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {alert}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating accent elements */}
              <div className="absolute -top-3 -right-3 h-24 w-24 rounded-2xl border border-primary/10 bg-primary/5 -z-10 rotate-12" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full border border-primary/10 bg-primary/5 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-1">
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Layers className="h-3.5 w-3.5" />
              Core Platform
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to run operations
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four integrated modules that work together seamlessly — no more juggling
              between disconnected tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-6 space-y-4 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                <div
                  className={`inline-flex items-center justify-center h-11 w-11 rounded-lg bg-gradient-to-br ${feature.accent}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / Trust ── */}
      <section id="security" className="py-20 md:py-28 border-t bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Shield className="h-3.5 w-3.5" />
                Enterprise-Grade Security
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Your data is safe with us
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Built on Supabase with row-level security, role-based access control,
                and comprehensive audit logging for every change.
              </p>
              <ul className="space-y-3">
                {[
                  "Role-based permissions — Admin, Manager, Viewer",
                  "Full audit trail for every inventory change",
                  "Row-level security on all database tables",
                  "Secure authentication with OAuth support",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Shield,
                  title: "Row-Level Security",
                  desc: "Database-enforced access policies",
                },
                {
                  icon: Zap,
                  title: "Real-Time Sync",
                  desc: "Instant updates across all devices",
                },
                {
                  icon: BarChart3,
                  title: "Audit Logging",
                  desc: "Track who changed what, and when",
                },
                {
                  icon: TrendingUp,
                  title: "Analytics",
                  desc: "Stock movement trends and insights",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <card.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-primary px-8 py-16 md:px-16 md:py-20 text-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-0">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground">
                Ready to take control?
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                Start managing your inventory smarter today. Set up in minutes,
                not days.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 text-base px-8 shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-primary-foreground/60">
                Free 14-day trial &middot; No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5 font-bold text-lg text-muted-foreground/60">
              <Package className="h-5 w-5" />
              <span>StockUp</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#security" className="hover:text-foreground transition-colors">
                Security
              </a>
              <Link href="/shop" className="hover:text-foreground transition-colors">
                Shop
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
            </nav>
            <p className="text-xs text-muted-foreground/60">
              &copy; 2026 StockUp Inventory Systems
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
