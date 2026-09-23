import Link from "next/link";
export function Brand() {
  return (
    <Link
      href="/"
      className="kinetic-brand"
      aria-label="Titan Kinetic — accueil"
    >
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        TITAN
        <span className="brand-second">
          KINETIC<span className="brand-dot">®</span>
        </span>
      </span>
    </Link>
  );
}
