import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { checkUsername, type ApiResponse } from "@/lib/api";
import { createTrial } from "@/lib/servers.functions";
import { getSelectedServerId } from "@/lib/apiConfig";
import { canCreateAccount, incrementDailyCount } from "@/lib/dailyLimit";
import { saveLastAccount } from "@/lib/accountStore";
import { getEnabledDurations, type TrialDuration } from "@/lib/durationConfig";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create Free VPN Account — Voltron Tunnel" },
      {
        name: "description",
        content: "Create a free Voltron Tunnel trial account for 1, 3 or 7 days. Instant configs.",
      },
      { property: "og:title", content: "Create Free VPN Account — Voltron Tunnel" },
      { property: "og:description", content: "Pick a username and get your VPN configs instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatePage,
});

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/i;

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

function CreatePage() {
  const navigate = useNavigate();
  const [limitInfo, setLimitInfo] = useState<ReturnType<typeof canCreateAccount> | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState<TrialDuration>(1);
  const [durations, setDurations] = useState<TrialDuration[]>([1, 3, 7]);
  const [nameState, setNameState] = useState<UsernameState>("idle");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLimitInfo(canCreateAccount());
    const enabled = getEnabledDurations();
    setDurations(enabled);
    setDays(enabled[0] ?? 1);
    const id = setInterval(() => setLimitInfo(canCreateAccount()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!username) {
      setNameState("idle");
      setNameError("");
      return;
    }
    if (!USERNAME_RE.test(username)) {
      setNameState("invalid");
      setNameError("Use 3-20 letters, numbers, dash or underscore.");
      return;
    }
    setNameState("checking");
    setNameError("");
    timer.current = setTimeout(async () => {
      const res = await checkUsername(username);
      if (res.available) {
        setNameState("available");
      } else if (res.available === false) {
        setNameState("taken");
        setNameError("❌ Username already used. Please try another one.");
      } else {
        setNameState("idle");
        setNameError(res.error || "Could not verify username right now.");
      }
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [username]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!USERNAME_RE.test(username)) {
      toast.error("Please enter a valid username");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const gate = canCreateAccount();
    if (!gate.allowed) {
      setLimitInfo(gate);
      toast.error("Daily limit reached");
      return;
    }
    setSubmitting(true);
    const serverId = getSelectedServerId();
    const res = (serverId
      ? await createTrial({ data: { serverId, username, password, days } }).catch(() => ({ success: false, error: "Could not reach server" }))
      : { success: false, error: "Please choose a server first" }) as ApiResponse;
    setSubmitting(false);

    if (res.success && res.account) {
      incrementDailyCount();
      saveLastAccount({
        account: { ...res.account, password: res.account.password || password },
        protocols: res.protocols || {},
        createdAt: Date.now(),
      });
      toast.success("Account created successfully");
      navigate({ to: "/account" });
      return;
    }

    const err = res.error || "Could not create your account. Please try again.";
    if (/taken|exists|used/i.test(err)) {
      setNameState("taken");
      setNameError("❌ Username already used. Please try another one.");
    }
    toast.error(err);
  };

  const pct = limitInfo ? Math.min(100, (limitInfo.count / Math.max(1, limitInfo.limit)) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          <span className="gradient-text">Create Free Account</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a username, a password, and your trial length.
        </p>

        {!limitInfo ? (
          <LoadingSpinner label="Checking availability…" />
        ) : !limitInfo.allowed ? (
          <div className="surface mt-8 p-8 text-center">
            <p className="text-3xl">🚫</p>
            <h2 className="mt-3 font-display text-xl font-bold text-destructive">
              Daily Limit Reached
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We've reached our daily limit of {limitInfo.limit} accounts.
              <br />
              Please come back in {limitInfo.resetIn}.
            </p>
            <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-full gradient-brand" />
            </div>
          </div>
        ) : (
          <>
            <div className="surface mt-8 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">📊 Today's Availability</span>
                <span className="font-semibold">
                  {limitInfo.remaining} / {limitInfo.limit} remaining
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Window resets in {limitInfo.resetIn}</p>
            </div>

            <form onSubmit={onSubmit} className="surface mt-5 space-y-5 p-6">
              <div>
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  autoComplete="off"
                  placeholder="voltron_user"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
                <p className="mt-1.5 min-h-5 text-xs">
                  {nameState === "checking" && <span className="text-muted-foreground">Checking…</span>}
                  {nameState === "available" && (
                    <span className="text-[var(--success)]">✅ Username is available</span>
                  )}
                  {nameError && <span className="text-destructive">{nameError}</span>}
                </p>
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min 4 characters"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div>
                <p className="text-sm font-medium">Duration</p>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={`rounded-xl border px-3 py-4 text-center transition-transform hover:scale-105 ${
                        days === d
                          ? "border-primary bg-primary/15 shadow-glow"
                          : "border-border bg-secondary/40"
                      }`}
                    >
                      <span className="block font-display text-xl font-bold">{d}</span>
                      <span className="text-xs text-muted-foreground">{d === 1 ? "day" : "days"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || nameState === "taken" || nameState === "checking"}
                className="w-full rounded-xl gradient-brand py-3.5 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? "Creating…" : "Create Account"}
              </button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
