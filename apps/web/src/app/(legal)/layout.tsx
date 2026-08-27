import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-(--spacing-container-max) flex-1 px-4 py-16 outline-none md:px-(--spacing-margin-desktop)">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
