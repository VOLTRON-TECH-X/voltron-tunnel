import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/servers", label: "Servers" },
  { to: "/create", label: "Create" },
  { to: "/check", label: "Status" },
] as const;

export function Brand() {
  return (
    <Link to="/" aria-label="Voltron Tunnel home" className="brand-shine group inline-flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl gradient-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5l8 14 8-14" />
          <path d="M8.5 5h7" opacity=".6" />
        </svg>
      </span>
      <span className="brand-heartbeat flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
          <span className="gradient-text">VOLTRON</span>
        </span>
        <span className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">Tunnel</span>
      </span>
      <span aria-hidden="true" className="brand-shine-sweep" />
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="relative mx-auto flex max-w-6xl flex-col items-center px-3 py-3 sm:flex-row sm:justify-end sm:px-4">
        <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2"><Brand /></div>
        <div className="mt-2 flex items-center gap-0.5 text-xs sm:mt-0 sm:gap-1 sm:text-sm">
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
