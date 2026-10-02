// Server-only helpers for multi-server (API domain + key) management.
export type ServerRow = {
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

export async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function verifyAdmin(auth?: { username?: string; password?: string } | null) {
  const u = process.env["ADMIN_USERNAME"];
  const p = process.env["ADMIN_PASSWORD"];
  if (!u || !p || !auth || auth.username !== u || auth.password !== p) {
    throw new Error("Unauthorized");
  }
}

export async function getServer(id: string): Promise<ServerRow | null> {
  const { data } = await (await db()).from("servers").select("*").eq("id", id).maybeSingle();
  return (data as ServerRow | null) ?? null;
}

export async function callServerApi(
  server: { api_url: string; api_key: string },
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body: unknown = null,
  timeoutMs = 15000,
): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${server.api_url.replace(/\/+$/, "")}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", "X-API-Key": server.api_key },
      body: method === "POST" && body != null ? JSON.stringify(body) : null,
      signal: ctrl.signal,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json.error || `HTTP ${res.status}` };
    return json;
  } catch (e: any) {
    return { success: false, error: e?.name === "AbortError" ? "Server timeout" : e?.message || "Network error" };
  } finally {
    clearTimeout(t);
  }
}

export function startOfTodayIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function countToday(serverId: string) {
  const { count } = await (await db())
    .from("account_creations")
    .select("id", { count: "exact", head: true })
    .eq("server_id", serverId)
    .gte("created_at", startOfTodayIso());
  return count ?? 0;
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

async function getJson(url: string, ms = 5000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json, application/dns-json" } });
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export async function resolveIp(host: string): Promise<string | null> {
  if (IPV4.test(host) || host.includes(":")) return host;
  const j = await getJson(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`);
  const a = j?.Answer?.find((x: any) => x.type === 1);
  return a?.data ?? null;
}

type Geo = { ip: string; country: string; city: string; region: string; code: string };
const geoCache = new Map<string, Geo>();

export async function geolocate(ipOrHost: string): Promise<Geo | null> {
  const ip = (await resolveIp(ipOrHost)) ?? ipOrHost;
  const cached = geoCache.get(ip);
  if (cached) return cached;
  let g: Geo | null = null;
  const a = await getJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (a?.success) g = { ip: a.ip, country: a.country, city: a.city, region: a.region, code: a.country_code };
  if (!g) {
    const b = await getJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (b && !b.error && b.country_name) g = { ip: b.ip, country: b.country_name, city: b.city, region: b.region, code: b.country_code };
  }
  if (!g) {
    const c = await getJson(`http://ip-api.com/json/${encodeURIComponent(ip)}`);
    if (c?.status === "success") g = { ip: c.query, country: c.country, city: c.city, region: c.regionName, code: c.countryCode };
  }
  if (g) geoCache.set(ip, g);
  return g;
}

export function num(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  return null;
}
