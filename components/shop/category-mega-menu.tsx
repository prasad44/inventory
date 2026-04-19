"use client";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const TOP_CATEGORIES = [
  { name: "Audio", slug: "audio" },
  { name: "Lighting", slug: "lighting" },
  { name: "Solar", slug: "solar" },
  { name: "Accessories", slug: "accessories" },
  { name: "Smart Home", slug: "smart-home" },
];

export function CategoryMegaMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden md:inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted">
        <Menu className="h-4 w-4" />
        Categories
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {TOP_CATEGORIES.map((c) => (
          <DropdownMenuItem key={c.slug} asChild>
            <Link href={`/c/${c.slug}`} className="cursor-pointer">
              {c.name}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link href="/deals" className="cursor-pointer text-primary font-medium">
            Deals
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
