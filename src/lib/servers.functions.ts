import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callServerApi, num } from "./servers.server";

const serverSchema = z.object({
  api_url: z.string().url().regex(/^https?:\/\//).max(200),
  api_key: z.string().min(1).max(300),
});

function hostOf(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try { return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).hostname; } catch { return v; }
}

// Live info for one server (IP, VPN domain, bandwidth). Called via server to avoid CORS.
export const getServerInfo = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ server: serverSchema }).parse(d))
  .handler(async ({ data }) => {
    const info = await callServerApi(data.server, "/api/dashboard/info", "GET", null, 8000);
    if (!info || info.success === false) {
      return { reachable: false, ip: null as string | null, domain: null as string | null, used: null as number | null, total: null as number | null };
    }
    const i = info.info ?? info;
    const bw = i.bandwidth ?? {};
    const ipRaw = i.ip ?? i.server_ip ?? i.public_ip ?? i.ipv4;
    return {
      reachable: true,
      ip: typeof ipRaw === "string" && ipRaw.trim() ? ipRaw.trim() : null,
      domain: hostOf(i.domain) ?? hostOf(i.server_domain) ?? hostOf(i.hostname) ?? hostOf(i.host),
      used: num(i.bandwidth_used_gb) ?? num(bw.used_gb) ?? num(bw.used),
      total: num(i.bandwidth_total_gb) ?? num(bw.total_gb) ?? num(bw.total),
    };
  });

export const createTrial = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      server: serverSchema,
      username: z.string().regex(/^[a-z0-9_-]{3,20}$/i),
      password: z.string().min(4).max(64),
      days: z.number().int().min(1).max(30),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = data.server;
    const res = await callServerApi(s, "/api/trial/create", "POST", {
      username: data.username, password: data.password, days: data.days,
    });
    if (res?.success && res.account) {
      const b = await callServerApi(s, "/api/banner/enable", "POST", null, 8000);
      if (b?.success) await callServerApi(s, "/api/banner/refresh", "POST", null, 8000);
    }
    return res;
  });
