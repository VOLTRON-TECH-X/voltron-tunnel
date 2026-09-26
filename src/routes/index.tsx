import { createFileRoute, Link } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voltron VPN — Free Trial VPN Accounts in Seconds" },
      {
        name: "description",
        content:
          "Get a free Voltron VPN trial account for 1, 3 or 7 days. SSH, DNSTT and more with unlimited bandwidth.",
      },
      { property: "og:title", content: "Voltron VPN — Free Trial VPN Accounts" },
      {
        property: "og:description",
        content: "Create your free VPN account in seconds. Multi-protocol, unlimited bandwidth.",
      },
    ],
  }),
  component: Home,
});

const features = [
  { icon: "⚡", title: "Instant Setup", text: "Your account and configs are ready in under 5 seconds." },
  { icon: "🔐", title: "Multi-Protocol", text: "SSH, DNSTT and more — copy-ready configuration for each." },
  { icon: "♾️", title: "Unlimited Bandwidth", text: "No throttling, no data caps during your trial period." },
  { icon: "🌍", title: "Fast Servers", text: "Low-latency routing built for mobile networks." },
];

function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 glow-panel" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs text-muted-foreground">
              🟢 Live servers · Free trials available
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold sm:text-6xl">
              <span className="gradient-text">🌍 Voltron VPN</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Get your free VPN account in seconds
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/create"
                className="rounded-xl gradient-brand px-7 py-3.5 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
              >
                🚀 Create Free Account
              </Link>
              <Link
                to="/check"
                className="rounded-xl border border-border bg-card/60 px-7 py-3.5 font-semibold transition-transform hover:scale-105"
              >
                🔎 Check Status
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="surface p-6 transition-transform hover:scale-[1.02]">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-3xl px-4">
          <div className="surface p-8 text-center">
            <h2 className="font-display text-2xl font-bold">Choose 1, 3 or 7 days</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a trial length, choose a username, and your configuration is generated instantly.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {[1, 3, 7].map((d) => (
                <div key={d} className="rounded-xl border border-border bg-secondary/50 px-6 py-4">
                  <p className="font-display text-2xl font-bold gradient-text">{d}</p>
                  <p className="text-xs text-muted-foreground">{d === 1 ? "day" : "days"}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
