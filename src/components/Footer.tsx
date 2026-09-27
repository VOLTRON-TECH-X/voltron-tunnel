import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="font-display text-lg font-semibold gradient-text">Voltron VPN</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Fast, free trial VPN accounts. Multi-protocol support with unlimited bandwidth.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <a
            href="https://t.me/voltrontechtx"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-4 py-2 transition-transform hover:scale-105"
          >
            💬 Telegram
          </a>
          <a
            href="https://wa.me/255000000000"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-4 py-2 transition-transform hover:scale-105"
          >
            📱 WhatsApp
          </a>
        </div>
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Voltron Techtx</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
