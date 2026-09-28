import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAccountStatus, type Account } from "@/lib/api";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check Account Status — Voltron Tunnel" },
      {
        name: "description",
        content: "Look up your Voltron Tunnel account status, expiry date and days remaining.",
      },
      { property: "og:title", content: "Check Account Status — Voltron Tunnel" },
      { property: "og:description", content: "Check expiry, days left and online devices." },
    ],
  }),
  component: CheckPage,
});

function CheckPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-z0-9_-]{3,20}$/i.test(username)) {
      toast.error("Please enter a valid username");
      return;
    }
    setLoading(true);
    setError("");
    setAccount(null);
    const res = await getAccountStatus(username);
    setLoading(false);
    if (res.success && res.account) {
      setAccount(res.account);
    } else {
      const msg = res.error || "Account not found";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          <span className="gradient-text">Check Status</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your username to see expiry and usage.
        </p>

        <form onSubmit={onSubmit} className="surface mt-6 flex gap-3 p-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="your username"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 disabled:opacity-50"
          >
            Check
          </button>
        </form>

        {loading && <LoadingSpinner label="Fetching status…" />}

        {error && !loading && (
          <div className="surface mt-5 p-5 text-sm text-destructive">❌ {error}</div>
        )}

        {account && (
          <div className="surface mt-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Username", account.username],
                ["Status", account.status ?? "—"],
                ["Expiry", account.expiry],
                ["Days Left", String(account.days_left ?? "—")],
                ["Online Devices", String(account.online ?? 0)],
                ["Device Limit", String(account.limit ?? "—")],
                ["Bandwidth", String(account.bandwidth ?? "—")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="mt-0.5 font-mono text-sm break-all">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
