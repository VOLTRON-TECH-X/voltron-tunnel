import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/create", label: "Create" },
  { to: "/check", label: "Check Status" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-end px-3 py-3 sm:px-4">
        <Link
          to="/"
          aria-label="Voltron Tunnel home"
          className="brand-heartbeat brand-shine absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-base font-bold sm:text-xl"
        >
          <span className="gradient-text">Voltron Tunnel</span>
          <span aria-hidden="true" className="brand-shine-sweep" />
        </Link>
        <div className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className={`${l.to === "/" ? "hidden sm:block" : ""} rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3`}
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
