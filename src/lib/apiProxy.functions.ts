import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  endpoint: z.string().startsWith("/"),
  method: z.enum(["GET", "POST"]).default("GET"),
  data: z.any().optional(),
  apiUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

// Server-side proxy to the Voltron API. Browsers block direct calls (CORS),
// so all API traffic goes through this function.
export const proxyApi = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const base =
      data.apiUrl ||
      process.env["VITE_API_URL"] ||
      "https://api.voltrontechtx.shop";
    const key = data.apiKey || process.env["VITE_API_KEY"] || "";

    try {
      const res = await fetch(`${base}${data.endpoint}`, {
        method: data.method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": key,
        },
        body:
          data.method === "POST" && data.data != null
            ? JSON.stringify(data.data)
            : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: json.error || `HTTP ${res.status}` };
      }
      return json;
    } catch (e: any) {
      return { success: false, error: e?.message || "Network error" };
    }
  });
