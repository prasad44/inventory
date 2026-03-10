"use client";

import { RibbonNav } from "./ribbon-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-muted/10">
      <RibbonNav />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
