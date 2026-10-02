import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callServerApi } from "./servers.server";

const inputSchema = z.object({
  endpoint: z.string().startsWith("/").max(200),
  method: z.enum(["GET", "POST"]).default("GET"),
  data: z.any().optional(),
  server: z.object({ api_url: z.string().max(200), api_key: z.string().max(300) }).optional(),
});

// Server-side proxy to the chosen server's API (avoids browser CORS blocks).
export const proxyApi = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const server = data.server ?? {
      api_url: process.env["VITE_API_URL"] ?? "",
      api_key: process.env["VITE_API_KEY"] ?? "",
    };
    if (!/^https?:\/\//.test(server.api_url) || !server.api_key) return { success: false, error: "No server configured" };
    return callServerApi(server, data.endpoint, data.method, data.data);
  });
