import { useState } from "react";
import { toast } from "sonner";
import type { Protocol } from "@/lib/api";

function rows(p: Protocol): [string, string][] {
  const out: [string, string][] = [];
  const push = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== "") out.push([k, String(v)]);
  };
  push("Host", p.host);
  push("IP", p.ip);
  push("Port", p.port);
  push("Port Range", p.port_range);
  push("Domain", p.domain);
  push("Public Key", p.pubkey);
  push("MTU", p.mtu);
  push("DNS", p.dns);
  push("DNS Alt", p.dns_alt);
  push("Exclude", p.exclude);
  push("Username", p.username);
  push("Password", p.password);
  push("Limit", p.limit);
  push("Info", p.info);
  return out;
}

export function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const [copied, setCopied] = useState(false);
  const data = rows(protocol);
  const text = data.map(([k, v]) => `${k}: ${v}`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${protocol.name}\n${text}`);
      setCopied(true);
      toast.success(`${protocol.name} config copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-xl text-lg"
            style={{ backgroundColor: `${protocol.color}22`, color: protocol.color }}
          >
            {protocol.icon || "🔌"}
          </span>
          <div>
            <p className="font-display font-semibold">{protocol.name}</p>
            <p className="text-xs text-muted-foreground uppercase">{protocol.type || protocol.id}</p>
          </div>
        </div>
        <button
          onClick={copy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs transition-transform hover:scale-105"
        >
          {copied ? "✅ Copied" : "📋 Copy"}
        </button>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        {data.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 border-b border-border/50 pb-1.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="max-w-[60%] truncate font-mono text-right text-xs">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ProtocolCard;
