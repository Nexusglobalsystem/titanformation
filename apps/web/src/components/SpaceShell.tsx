import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
import { SpaceNav, type SpaceNavItem } from "./SpaceNav";

// Couplé au libellé passé par chaque page — pas idéal, mais évite de
// modifier les ~12 appelants pour un seul prop supplémentaire.
const NAV_BY_TITLE: Record<string, SpaceNavItem[]> = {
  "Espace administration": [
    { label: "Tableau de bord", href: "/admin" },
    { label: "Formations", href: "/admin/formations" },
    { label: "Utilisateurs", href: "/admin/utilisateurs" },
    { label: "Rôles & permissions", href: "/admin/roles-permissions" },
    { label: "Tâches", href: "/admin/taches" },
    { label: "Réclamations", href: "/admin/reclamations" },
    { label: "Documents", href: "/admin/documents" },
    { label: "Statistiques", href: "/admin/statistiques" },
    { label: "Notifications", href: "/admin/notifications" },
  ],
  "Espace formateur": [
    { label: "Tableau de bord", href: "/formateur" },
    { label: "Mes tâches", href: "/formateur/taches" },
    { label: "Notifications", href: "/formateur/notifications" },
  ],
  "Espace entreprise": [
    { label: "Tableau de bord", href: "/entreprise" },
    { label: "Notifications", href: "/entreprise/notifications" },
  ],
  "Espace apprenant": [
    { label: "Tableau de bord", href: "/apprenant" },
    { label: "Réserver un rendez-vous", href: "/apprenant/reservations" },
    { label: "Réclamations", href: "/apprenant/reclamations" },
    { label: "Mes documents", href: "/apprenant/documents" },
    { label: "Notifications", href: "/apprenant/notifications" },
  ],
};

export async function SpaceShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  const navItems = (NAV_BY_TITLE[title] ?? []).map((item) =>
    item.href.endsWith("/notifications") && unreadCount > 0 ? { ...item, badge: unreadCount } : item,
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-DEFAULT bg-primary font-display text-sm font-bold text-accent"
          >
            TK
          </span>
          <span className="font-display text-sm font-semibold text-foreground">Titan Kinetic</span>
        </div>
        <SpaceNav items={navItems} />
        <div className="mt-auto border-t border-border p-4">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-DEFAULT bg-primary font-display text-sm font-bold text-accent"
            >
              TK
            </span>
          </div>
          <span className="font-display text-lg font-semibold text-foreground">{title}</span>
          <div className="md:hidden">
            <SignOutButton />
          </div>
        </header>
        {navItems.length > 0 && (
          <div className="overflow-x-auto border-b border-border px-4 py-2 md:hidden">
            <SpaceNav items={navItems} direction="row" />
          </div>
        )}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
