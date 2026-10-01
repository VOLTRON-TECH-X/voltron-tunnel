import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callServerApi, db, getServer, verifyAdmin, type ServerRow } from "./servers.server";

const inputSchema = z.object({
  endpoint: z.string().startsWith("/").max(200),
  method: z.enum(["GET", "POST"]).default("GET"),
  data: z.any().optional(),
  serverId: z.string().uuid().optional(),
  auth: z.object({ username: z.string(), password: z.string() }).optional(),
});

const PUBLIC = [/^\/api\/trial\/check$/, /^\/api\/trial\/status\/[\w-]+$/, /^\/api\/protocols\/status$/];

// Server-side proxy to the selected server's API. Keys never leave the server.
export const proxyApi = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const isPublic = PUBLIC.some((r) => r.test(data.endpoint));
    if (!isPublic) {
      try { verifyAdmin(data.auth); } catch { return { success: false, error: "Unauthorized" }; }
    }
    let server: ServerRow | null = null;
    if (data.serverId) server = await getServer(data.serverId);
    if (!server) {
      const { data: rows } = await (await db()).from("servers").select("*").order("created_at").limit(1);
      server = (rows?.[0] as ServerRow | undefined) ?? null;
    }
    if (!server) return { success: false, error: "No server configured" };
    if (isPublic && !server.enabled) return { success: false, error: "Server is offline" };
    return callServerApi(server, data.endpoint, data.method, data.data);
  });
