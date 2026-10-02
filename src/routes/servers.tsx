import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { listPublicServers, type PublicServer } from "@/lib/servers.functions";
import { setSelectedServerId } from "@/lib/apiConfig";

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
  const q = useQuery({ queryKey: ["public-servers"], queryFn: () => listPublicServers(), refetchInterval: 60_000 });
  const servers = q.data?.servers ?? [];
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
  const bw = s.bandwidthTotalGb != null
    ? `${s.bandwidthUsedGb ?? 0} / ${s.bandwidthTotalGb} GB`
    : s.bandwidthUsedGb != null ? `${s.bandwidthUsedGb} GB used · Unlimited` : "Unlimited";
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{s.flag} {s.name}</p>
          <p className="text-xs text-muted-foreground">{[s.city, s.country].filter(Boolean).join(", ") || "Unknown location"}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${s.online ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          {s.online ? "● Online" : "● Offline"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Domain</dt><dd className="break-all text-right">{s.domain}</dd>
        <dt className="text-muted-foreground">IP</dt><dd className="break-all text-right">{s.ip ?? "—"}</dd>
        <dt className="text-muted-foreground">Bandwidth</dt><dd className="text-right">{bw}</dd>
        <dt className="text-muted-foreground">Created today</dt><dd className="text-right">{s.createdToday}</dd>
        <dt className="text-muted-foreground">Remaining</dt><dd className="text-right">{s.remaining} / {s.dailyLimit}</dd>
      </dl>
      <button
        disabled={!s.online || full}
        onClick={() => { setSelectedServerId(s.id); navigate({ to: "/create" }); }}
        className="mt-5 w-full rounded-xl gradient-brand py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {!s.online ? "Server offline" : full ? "Full today" : "Create account"}
      </button>
    </div>
  );
}
