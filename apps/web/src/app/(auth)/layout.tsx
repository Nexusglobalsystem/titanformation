import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { GridBackdrop } from "@/components/GridBackdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="dark" className="campus-root flex min-h-screen flex-col">
      <PublicHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 outline-none"
      >
        <GridBackdrop mask="radial-gradient(ellipse 60% 70% at 50% 40%, black 30%, transparent 90%)" />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
