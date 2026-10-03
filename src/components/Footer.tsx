import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { contactHref, getContactConfig } from "@/lib/siteConfig";

export function Footer() {
  const [contacts, setContacts] = useState(getContactConfig);

  useEffect(() => {
    const sync = () => setContacts(getContactConfig());
    window.addEventListener("storage", sync);
    window.addEventListener("voltron-site-config-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("voltron-site-config-change", sync);
    };
  }, []);

  const telegram = contactHref("telegram", contacts.telegram);
  const whatsapp = contactHref("whatsapp", contacts.whatsapp);

  return (
    <footer className="mt-20 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="font-display text-lg font-semibold gradient-text">Voltron Tunnel</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Fast, free trial VPN accounts. Multi-protocol support with unlimited bandwidth.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {telegram && <a
            href={telegram}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-4 py-2 transition-transform hover:scale-105"
          >
            <Send className="mr-1 inline size-4" /> Telegram
          </a>}
          {whatsapp && <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-4 py-2 transition-transform hover:scale-105"
          >
            <MessageCircle className="mr-1 inline size-4" /> WhatsApp
          </a>}
        </div>
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Voltron Techtx</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
