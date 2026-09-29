import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtocolCard from "@/components/ProtocolCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getLastAccount, type StoredAccount } from "@/lib/accountStore";
import { canCreateAccount } from "@/lib/dailyLimit";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your VPN Account — Voltron Tunnel" },
      {
        name: "description",
        content: "View your Voltron Tunnel trial account details and copy protocol configurations.",
      },
      { property: "og:title", content: "Your VPN Account — Voltron Tunnel" },
      { property: "og:description", content: "Account details and ready-to-use protocol configs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StoredAccount | null>(null);
  const [limit, setLimit] = useState<ReturnType<typeof canCreateAccount> | null>(null);

  useEffect(() => {
    setData(getLastAccount());
    setLimit(canCreateAccount());
    setLoading(false);
  }, []);

  const copyAll = async () => {
    if (!data) return;
    const a = data.account;
    const lines = [
      "=== Voltron Tunnel Account ===",
      `Username: ${a.username}`,
      `Password: ${a.password ?? ""}`,
      `Expiry: ${a.expiry}`,
      `Limit: ${a.limit}`,
      `Bandwidth: ${a.bandwidth ?? "Unlimited"}`,
      `Server: ${a.server ?? ""}`,
      `Server IP: ${a.server_ip ?? ""}`,
      "",
      ...Object.values(data.protocols).map((p) =>
        [
          `--- ${p.name} ---`,
          ...Object.entries(p)
            .filter(([k, v]) => !["id", "name", "icon", "color"].includes(k) && v !== undefined && v !== "")
            .map(([k, v]) => `${k}: ${v}`),
          "",
        ].join("\n"),
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      toast.success("All details copied");
    } catch (e) {
      console.error(e);
      toast.error("Could not copy to clipboard");
    }
    return lines;
  };

  const download = () => {
    if (!data) return;
    const a = data.account;
    const text = JSON.stringify({ account: a, protocols: data.protocols }, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voltron-vpn-${a.username}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Config downloaded");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingSpinner label="Loading account…" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="surface p-8">
            <p className="text-3xl">🔍</p>
            <h1 className="mt-3 font-display text-xl font-bold">No account found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a free account, or look up an existing one by username.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/create"
                className="rounded-xl gradient-brand px-5 py-2.5 font-semibold text-primary-foreground"
              >
                🚀 Create Account
              </Link>
              <Link to="/check" className="rounded-xl border border-border px-5 py-2.5 font-semibold">
                🔎 Check Status
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const a = data.account;
  const protocols = Object.values(data.protocols);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto min-w-0 max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          <span className="gradient-text">Your Account</span>
        </h1>

        {limit && (
          <p className="mt-2 text-sm text-muted-foreground">
            📊 Today's Remaining: {limit.remaining} / {limit.limit}
          </p>
        )}

        <div className="surface mt-6 p-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {[
              ["Username", a.username],
              ["Password", a.password ?? "—"],
              ["Expiry", a.expiry],
              ["Device Limit", String(a.limit ?? "—")],
              ["Bandwidth", a.bandwidth ?? "Unlimited"],
              ["Server", a.server ?? "—"],
              ["Server IP", a.server_ip ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={copyAll}
              className="rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              📋 Copy All Details
            </button>
            <button
              onClick={download}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
            >
              ⬇️ Download Config
            </button>
            <Link
              to="/check"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
            >
              🔎 Check Status
            </Link>
          </div>
        </div>

        <h2 className="mt-10 font-display text-xl font-bold">Protocols ({protocols.length})</h2>
        {protocols.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No protocol data was returned for this account.</p>
        ) : (
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            {protocols.map((p) => (
              <ProtocolCard key={p.id || p.name} protocol={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
