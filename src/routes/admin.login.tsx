import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminLogin, isAdminLoggedIn } from "@/lib/admin";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Voltron Tunnel" },
      { name: "description", content: "Sign in to the Voltron Tunnel admin panel." },
      { property: "og:title", content: "Admin Login — Voltron Tunnel" },
      { property: "og:description", content: "Sign in to the Voltron Tunnel admin panel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) navigate({ to: "/admin", replace: true });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(username.trim(), password)) {
      toast.success("Welcome back, admin");
      navigate({ to: "/admin" });
    } else {
      toast.error("Invalid username or password");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 shadow-glow"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-admin text-2xl">🛡️</div>
          <h1 className="font-display text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Voltron Tunnel control panel</p>
        </div>
        <input
          className="w-full rounded-lg border border-input bg-background px-3 py-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          className="w-full rounded-lg border border-input bg-background px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button className="w-full rounded-lg bg-admin py-2 font-semibold text-admin-foreground transition-opacity hover:opacity-90">
          Sign in
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground underline">
          Back to site
        </Link>
      </form>
    </div>
  );
}
