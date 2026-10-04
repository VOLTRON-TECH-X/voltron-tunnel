// Browser-stored server list (API domain + key). Works on any host (Vercel, Lovable…).
import { getSelectedServerId } from "./apiConfig";
import { incrementCloudCount, pushKey } from "./cloudSync";

export type LocalServer = {
  id: string;
  name: string;
  category: string;
  api_url: string;
  api_key: string;
  enabled: boolean;
  daily_limit: number;
  bandwidth_total_gb: number | null;
  created_at: string;
};

const KEY = "voltron_servers";
const COUNT_KEY = "voltron_server_counts";

function env(k: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[k];
}

export function listServers(): LocalServer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LocalServer[];
  } catch { /* ignore */ }
  const url = env("VITE_API_URL");
  const key = env("VITE_API_KEY");
  if (!url || !key) return [];
  const seed: LocalServer[] = [{
    id: "default", name: "Default", category: "Premium", api_url: url, api_key: key, enabled: true,
    daily_limit: parseInt(env("VITE_DEFAULT_DAILY_LIMIT") || "10", 10) || 10,
    bandwidth_total_gb: null, created_at: new Date().toISOString(),
  }];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function write(list: LocalServer[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("voltron-server-change"));
  void pushKey("voltron_servers");
}

export function saveServer(s: Omit<LocalServer, "id" | "created_at" | "enabled"> & { id?: string | undefined }) {
  const list = listServers();
  if (s.id) write(list.map((x) => (x.id === s.id ? { ...x, ...s, id: x.id } : x)));
  else write([...list, { ...s, id: crypto.randomUUID(), enabled: true, created_at: new Date().toISOString() }]);
}

export function deleteServer(id: string) { write(listServers().filter((s) => s.id !== id)); }
export function toggleServer(id: string, enabled: boolean) {
  write(listServers().map((s) => (s.id === id ? { ...s, enabled } : s)));
}

export function getServerById(id?: string): LocalServer | undefined {
  const list = listServers();
  return list.find((s) => s.id === id) ?? (id ? undefined : list[0]);
}
export function getSelectedServer(): LocalServer | undefined {
  return getServerById(getSelectedServerId()) ?? listServers()[0];
}

type Counts = Record<string, { day: string; n: number }>;
const today = () => new Date().toISOString().slice(0, 10);
function counts(): Counts {
  try { return JSON.parse(localStorage.getItem(COUNT_KEY) || "{}"); } catch { return {}; }
}
export function countToday(id: string) {
  const c = counts()[id];
  return c && c.day === today() ? c.n : 0;
}
export function incrementServerCount(id: string) {
  const c = counts();
  c[id] = { day: today(), n: countToday(id) + 1 };
  localStorage.setItem(COUNT_KEY, JSON.stringify(c));
  void incrementCloudCount(id);
}
