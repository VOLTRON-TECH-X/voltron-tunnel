import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/create", label: "Create" },
  { to: "/check", label: "Check Status" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl gradient-brand text-base shadow-glow">
            🌍
          </span>
          <span className="gradient-text">Voltron VPN</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
