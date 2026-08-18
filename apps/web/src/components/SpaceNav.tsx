"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SpaceNavItem = { label: string; href: string; badge?: number };

export function SpaceNav({
  items,
  direction = "col",
}: {
  items: SpaceNavItem[];
  direction?: "col" | "row";
}) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className={`flex gap-1 ${direction === "col" ? "flex-col px-3" : "flex-row"}`}>
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-DEFAULT px-3 py-2 font-body text-sm transition-colors ${
              isActive
                ? "bg-primary text-on-primary"
                : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            {item.label}
            {!!item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
