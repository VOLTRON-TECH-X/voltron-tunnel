import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getServerInfo } from "@/lib/servers.functions";
import { setSelectedServerId } from "@/lib/apiConfig";
import { countToday, listServers, type LocalServer } from "@/lib/serverStore";
import { flagEmoji, geolocate } from "@/lib/geo";

type PublicServer = {
  id: string; category: string; online: boolean; domain: string; ip: string | null;
  country: string | null; city: string | null; flag: string;
  bandwidthUsedGb: number | null; bandwidthTotalGb: number | null;
  createdToday: number; dailyLimit: number; remaining: number;
};

async function describe(s: LocalServer): Promise<PublicServer> {
  const apiHost = (() => { try { return new URL(s.api_url).hostname; } catch { return s.api_url; } })();
  const info = s.enabled
    ? await getServerInfo({ data: { server: { api_url: s.api_url, api_key: s.api_key } } }).catch(() => null)
    : null;
  const domain = info?.domain ?? apiHost.replace(/^api\./i, "");
  // Prefer the real server IP reported by the API; otherwise resolve the server domain.
  const geo = (info?.ip ? await geolocate(info.ip) : null) ?? (await geolocate(domain)) ?? (await geolocate(apiHost));
  const createdToday = countToday(s.id);
  return {
    id: s.id, category: s.category, online: s.enabled && !!info?.reachable, domain,
    ip: info?.ip ?? geo?.ip ?? null, country: geo?.country ?? null, city: geo?.city || geo?.region || null,
    flag: flagEmoji(geo?.code), bandwidthUsedGb: info?.used ?? null,
    bandwidthTotalGb: s.bandwidth_total_gb ?? info?.total ?? null,
    createdToday, dailyLimit: s.daily_limit, remaining: Math.max(0, s.daily_limit - createdToday),
  };
}

export const Route = createFileRoute("/servers")({
  head: () => ({
    meta: [
      { title: "Choose a Server — Voltron Tunnel" },
      { name: "description", content: "Pick a Voltron Tunnel server by location, see live status, bandwidth and daily slots." },
      { property: "og:title", content: "Choose a Server — Voltron Tunnel" },
      { property: "og:description", content: "Live server list with location, bandwidth and daily availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServersPage,
});

function ServersPage() {
  const q = useQuery({ queryKey: ["public-servers"], queryFn: () => Promise.all(listServers().map(describe)), refetchInterval: 60_000 });
  const servers = q.data ?? [];
  const groups = servers.reduce<Record<string, PublicServer[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold"><span className="gradient-text">Choose a Server</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Select a server, then create your free account.</p>
        {q.isLoading ? (
          <LoadingSpinner label="Loading servers…" />
        ) : servers.length === 0 ? (
          <div className="surface mt-8 p-8 text-center text-sm text-muted-foreground">No servers available right now.</div>
        ) : (
          Object.entries(groups).map(([cat, list]) => (
            <section key={cat} className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{cat}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {list.map((s) => <ServerCard key={s.id} s={s} />)}
              </div>
            </section>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}

function ServerCard({ s }: { s: PublicServer }) {
  const navigate = useNavigate();
  const full = s.remaining <= 0;
  const capacity = Math.min(100, (s.createdToday / Math.max(1, s.dailyLimit)) * 100);
  const bw = s.bandwidthTotalGb != null
    ? `${s.bandwidthUsedGb ?? 0} / ${s.bandwidthTotalGb} GB`
    : s.bandwidthUsedGb != null ? `${s.bandwidthUsedGb} GB used · Unlimited` : "Unlimited";
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-wide">{s.flag} {s.country ? s.country.toUpperCase() : "LOCATING…"}</p>
          <p className="text-xs text-muted-foreground">{[s.city, s.country].filter(Boolean).join(", ") || "Location unavailable"}</p>
        </div>
        <div className="shrink-0">
          <span className={`status-ripple rounded-full px-4 py-2 text-base font-bold ${s.online ? "is-online bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            <span className="relative z-10">● {s.online ? "Online" : "Offline"}</span>
          </span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Domain</dt><dd className="break-all text-right">{s.domain}</dd>
        <dt className="text-muted-foreground">IP</dt><dd className="break-all text-right">{s.ip ?? "—"}</dd>
        <dt className="text-muted-foreground">Bandwidth</dt><dd className="text-right">{bw}</dd>
      </dl>
      <div className="mt-5 rounded-lg border border-border bg-secondary/45 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold">Daily account capacity</span>
          <span className={full ? "font-semibold text-destructive" : "text-muted-foreground"}>{s.createdToday} created · {s.remaining} left</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-background shadow-inner" role="progressbar" aria-label="Daily account capacity used" aria-valuemin={0} aria-valuemax={s.dailyLimit} aria-valuenow={s.createdToday}>
          <div className={`h-full rounded-full transition-[width] duration-700 ${full ? "bg-destructive" : "gradient-brand"}`} style={{ width: `${capacity}%` }} />
        </div>
      </div>
      <Button
        disabled={!s.online || full}
        onClick={() => { setSelectedServerId(s.id); navigate({ to: "/create" }); }}
        className="mt-4 h-11 w-full gradient-brand font-semibold shadow-glow transition-transform hover:scale-[1.02] disabled:hover:scale-100"
      >
        {!s.online ? "Server offline" : full ? "Full today" : "Create account"}
      </Button>
    </div>
  );
}
