import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  callServerApi,
  countToday,
  db,
  flagEmoji,
  geolocate,
  getServer,
  num,
  verifyAdmin,
  type ServerRow,
} from "./servers.server";

const authSchema = z.object({ username: z.string().max(100), password: z.string().max(200) });

export interface PublicServer {
  id: string;
  name: string;
  category: string;
  online: boolean;
  domain: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  flag: string;
  bandwidthUsedGb: number | null;
  bandwidthTotalGb: number | null;
  createdToday: number;
  dailyLimit: number;
  remaining: number;
}

function hostOf(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try { return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).hostname; } catch { return v; }
}

async function describe(s: ServerRow): Promise<PublicServer> {
  const apiHost = hostOf(s.api_url) ?? s.api_url;
  const createdToday = await countToday(s.id);
  let ip: string | null = null;
  let serverDomain: string | null = null;
  let used: number | null = null;
  let total: number | null = s.bandwidth_total_gb != null ? Number(s.bandwidth_total_gb) : null;
  let reachable = false;
  if (s.enabled) {
    const info = await callServerApi(s, "/api/dashboard/info", "GET", null, 7000);
    if (info && info.success !== false) {
      reachable = true;
      const i = info.info ?? info;
      ip = typeof i.ip === "string" ? i.ip : typeof i.server_ip === "string" ? i.server_ip : null;
      serverDomain = hostOf(i.domain) ?? hostOf(i.server_domain) ?? hostOf(i.hostname) ?? hostOf(i.host);
      const bw = i.bandwidth ?? {};
      used = num(i.bandwidth_used_gb) ?? num(bw.used_gb) ?? num(bw.used);
      total = total ?? num(i.bandwidth_total_gb) ?? num(bw.total_gb) ?? num(bw.total);
    }
  }
  // Server domain = the VPN host, not the API host (strip a leading "api." label).
  const domain = serverDomain ?? apiHost.replace(/^api\./i, "");
  const geo = await geolocate(ip ?? domain).then((g) => g ?? geolocate(apiHost));
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    online: s.enabled && reachable,
    domain,
    ip: ip ?? geo?.ip ?? null,
    country: geo?.country ?? null,
    city: geo?.city || geo?.region || null,
    flag: flagEmoji(geo?.code),
    bandwidthUsedGb: used,
    bandwidthTotalGb: total,
    createdToday,
    dailyLimit: s.daily_limit,
    remaining: Math.max(0, s.daily_limit - createdToday),
  };
}

export const listPublicServers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("servers").select("*").order("created_at");
  if (error) return { servers: [] as PublicServer[], error: "Could not load servers" };
  const servers = await Promise.all((data as ServerRow[]).map(describe));
  return { servers, error: null as string | null };
});

export const createTrial = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      serverId: z.string().uuid(),
      username: z.string().regex(/^[a-z0-9_-]{3,20}$/i),
      password: z.string().min(4).max(64),
      days: z.number().int().min(1).max(30),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await getServer(data.serverId);
    if (!s || !s.enabled) return { success: false, error: "Server is offline" };
    if ((await countToday(s.id)) >= s.daily_limit) return { success: false, error: "Daily limit reached for this server" };
    const res = await callServerApi(s, "/api/trial/create", "POST", {
      username: data.username, password: data.password, days: data.days,
    });
    if (res?.success && res.account) {
      await (await db()).from("account_creations").insert({ server_id: s.id, username: data.username });
      // Dynamic banner: enable + refresh for the new account, never blocking.
      const b = await callServerApi(s, "/api/banner/enable", "POST", null, 8000);
      if (b?.success) await callServerApi(s, "/api/banner/refresh", "POST", null, 8000);
    }
    return res;
  });

// ---- Admin ----
export const adminListServers = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ auth: authSchema }).parse(d))
  .handler(async ({ data }) => {
    verifyAdmin(data.auth);
    const { data: rows } = await (await db()).from("servers").select("*").order("created_at");
    return (rows as ServerRow[]) ?? [];
  });

export const adminSaveServer = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      auth: authSchema,
      server: z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(60),
        category: z.string().trim().min(1).max(40),
        api_url: z.string().trim().url().regex(/^https?:\/\//).max(200),
        api_key: z.string().trim().min(1).max(300),
        daily_limit: z.number().int().min(1).max(1000),
        bandwidth_total_gb: z.number().min(0).max(1e7).nullable(),
      }),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    verifyAdmin(data.auth);
    const { id, ...fields } = data.server;
    const q = (await db()).from("servers");
    const { error } = id ? await q.update(fields).eq("id", id) : await q.insert(fields);
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const adminDeleteServer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ auth: authSchema, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    verifyAdmin(data.auth);
    const { error } = await (await db()).from("servers").delete().eq("id", data.id);
    return error ? { success: false, error: error.message } : { success: true };
  });

export const adminToggleServer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ auth: authSchema, id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    verifyAdmin(data.auth);
    const { error } = await (await db()).from("servers").update({ enabled: data.enabled }).eq("id", data.id);
    return error ? { success: false, error: error.message } : { success: true };
  });
