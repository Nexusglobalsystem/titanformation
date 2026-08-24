import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Inscriptions" },
  { href: "/admin/formations", label: "Formations" },
] as const;

export function AdminSectionTabs({ active }: { active: "inscriptions" | "formations" }) {
  return (
    <nav className="flex gap-4 border-b border-border pb-2">
      {TABS.map((tab) => {
        const isActive = (active === "inscriptions" && tab.href === "/admin") || (active === "formations" && tab.href === "/admin/formations");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              isActive
                ? "border-b-2 border-accent pb-2 font-body text-sm font-semibold text-accent"
                : "pb-2 font-body text-sm text-foreground-muted hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
