import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import DynamicBannerCard from "@/components/admin/DynamicBannerCard";
import { adminLogout, getAdminSession } from "@/lib/admin";
import {
  deleteUser,
  getAllUsers,
  getDashboardInfo,
  lockUser,
  unlockUser,
  type Account,
} from "@/lib/api";
import { canCreateAccount, getDailyLimit, resetDailyState, setDailyLimit } from "@/lib/dailyLimit";
import ServersManager from "@/components/admin/ServersManager";
import SiteContentManager from "@/components/admin/SiteContentManager";
import {
  getEnabledDurations,
  setEnabledDurations,
  TRIAL_DURATIONS,
  type TrialDuration,
} from "@/lib/durationConfig";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Voltron Tunnel" },
      { name: "description", content: "Manage Voltron Tunnel users and daily limits." },
      { property: "og:title", content: "Admin Dashboard — Voltron Tunnel" },
      { property: "og:description", content: "Manage Voltron Tunnel users and daily limits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedAdminRoute>
      <Dashboard />
    </ProtectedAdminRoute>
  ),
});

function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Account[]>([]);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [limitInput, setLimitInput] = useState(String(getDailyLimit()));
  const [daily, setDaily] = useState(canCreateAccount());
  const [busy, setBusy] = useState<string | null>(null);
  const [durations, setDurations] = useState<TrialDuration[]>(() => getEnabledDurations());

  const load = useCallback(async () => {
    setLoading(true);
    const [u, d] = await Promise.all([getAllUsers(), getDashboardInfo()]);
    if (u.error) toast.error(`Users: ${u.error}`);
    setUsers(u.users ?? (Array.isArray(u['data']) ? u['data'] : []));
    if (!d.error) setInfo((d.info ?? d) as Record<string, unknown>);
    setDaily(canCreateAccount());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (name: string, fn: (u: string) => Promise<{ error?: string }>, label: string) => {
    if (label === "delete" && !confirm(`Delete ${name}?`)) return;
    setBusy(name);
    const r = await fn(name);
    setBusy(null);
    if (r.error) toast.error(r.error);
    else {
      toast.success(`${name} ${label}d`);
      load();
    }
  };

  const saveLimit = () => {
    const n = parseInt(limitInput, 10);
    if (!n || n < 1 || n > 1000) { toast.error("Limit must be 1–1000"); return; }
    setDailyLimit(n);
    setDaily(canCreateAccount());
    toast.success(`Daily limit set to ${n}`);
  };

  const toggleDuration = (duration: TrialDuration) => {
    const next = durations.includes(duration)
      ? durations.filter((item) => item !== duration)
      : [...durations, duration].sort((a, b) => a - b);

    if (!setEnabledDurations(next)) {
      toast.error("Keep at least one duration enabled");
      return;
    }

    setDurations(next);
    toast.success(`${duration}-day duration ${next.includes(duration) ? "enabled" : "disabled"}`);
  };

  const filtered = users.filter((u) => u.username?.toLowerCase().includes(search.toLowerCase()));
  const session = getAdminSession();

  const stats = [
    { label: "Total users", value: users.length },
    { label: "Online", value: users.filter((u) => (u.online ?? 0) > 0).length },
    { label: "Created today", value: `${daily.count}/${daily.limit}` },
    { label: "Resets in", value: daily.resetIn },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">🛡️ Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {session?.username}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">
            Refresh
          </button>
          <button
            onClick={() => {
              adminLogout();
              navigate({ to: "/admin/login" });
            }}
            className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display font-semibold">Daily creation limit</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={1000}
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="w-28 rounded-lg border border-input bg-background px-3 py-2"
          />
          <button onClick={saveLimit} className="rounded-lg bg-admin px-4 py-2 text-sm text-admin-foreground">
            Save
          </button>
          <button
            onClick={() => {
              resetDailyState();
              setDaily(canCreateAccount());
              toast.success("Today's counter reset");
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Reset counter
          </button>
        </div>
      </section>

      <DynamicBannerCard />

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-display font-semibold">Trial durations</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Disabled choices are hidden from the account creation page.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {TRIAL_DURATIONS.map((duration) => {
            const enabled = durations.includes(duration);
            return (
              <button
                key={duration}
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggleDuration(duration)}
                className={`flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors ${
                  enabled ? "border-admin bg-admin/15 text-foreground" : "border-border bg-secondary/30 text-muted-foreground"
                }`}
              >
                <span>{duration} {duration === 1 ? "day" : "days"}</span>
                <span className={`relative h-5 w-9 rounded-full ${enabled ? "bg-admin" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 size-4 rounded-full bg-background transition-transform ${enabled ? "left-[1.125rem]" : "left-0.5"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <ServersManager onSelect={load} />

      <SiteContentManager />

      {info && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-display font-semibold">Server info</h2>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {Object.entries(info)
              .filter(([, v]) => typeof v !== "object")
              .map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-mono">{String(v)}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold">Users</h2>
          <input
            placeholder="Search username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        {loading ? (
          <LoadingSpinner label="Loading users…" />
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Username</th>
                  <th className="p-2">Expiry</th>
                  <th className="p-2">Limit</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const locked = u.status?.toLowerCase().includes("lock");
                  return (
                    <tr key={u.username} className="border-t border-border">
                      <td className="p-2 font-mono">{u.username}</td>
                      <td className="p-2">{u.expiry}</td>
                      <td className="p-2">{u.limit}</td>
                      <td className="p-2">{u.status ?? "active"}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={busy === u.username}
                            onClick={() =>
                              locked
                                ? act(u.username, unlockUser, "unlock")
                                : act(u.username, lockUser, "lock")
                            }
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                          >
                            {locked ? "Unlock" : "Lock"}
                          </button>
                          <button
                            disabled={busy === u.username}
                            onClick={() => act(u.username, deleteUser, "delete")}
                            className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
