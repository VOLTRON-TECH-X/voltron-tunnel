// Shared site state: every browser reads the same settings from the cloud,
// and admin edits are pushed there (verified by the admin password).
import { getAdminAuth } from "./admin";

export const SHARED_KEYS = [
  "voltron_servers",
  "voltron_server_counts",
  "voltron_contact_config",
  "voltron_public_notices",
  "voltron_duration_config",
  "voltron_daily_config",
] as const;
type SharedKey = (typeof SHARED_KEYS)[number];

async function client() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

function notifyAll() {
  window.dispatchEvent(new Event("voltron-server-change"));
  window.dispatchEvent(new Event("voltron-site-config-change"));
  window.dispatchEvent(new Event("voltron-duration-change"));
  window.dispatchEvent(new Event("voltron-cloud-sync"));
}

let ready = false;
export const isCloudReady = () => ready;

export async function syncFromCloud(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const sb = await client();
    const { data, error } = await sb.from("site_state").select("key, value");
    if (error) throw error;
    const cloud = new Map((data ?? []).map((r) => [r.key, r.value]));
    const auth = getAdminAuth();
    for (const key of SHARED_KEYS) {
      if (cloud.has(key)) {
        localStorage.setItem(key, JSON.stringify(cloud.get(key)));
      } else if (auth && localStorage.getItem(key)) {
        // First run: upload what the admin already set up in this browser.
        void pushKey(key);
      }
    }
    ready = true;
    notifyAll();
    return true;
  } catch (e) {
    console.error("[cloudSync] pull failed", e);
    return false;
  }
}

export async function pushKey(key: SharedKey): Promise<void> {
  const auth = getAdminAuth();
  const raw = localStorage.getItem(key);
  if (!auth || raw == null) return;
  try {
    const sb = await client();
    const { error } = await sb.rpc("admin_set_state", {
      p_username: auth.username, p_password: auth.password, p_key: key, p_value: JSON.parse(raw),
    });
    if (error) throw error;
  } catch (e) {
    console.error("[cloudSync] push failed", key, e);
    const { toast } = await import("sonner");
    toast.error("Imeshindwa kuhifadhi mtandaoni. Jaribu tena.");
  }
}

export async function verifyAdminCloud(username: string, password: string): Promise<boolean | null> {
  try {
    const sb = await client();
    const { data, error } = await sb.rpc("admin_verify", { p_username: username, p_password: password });
    if (error) throw error;
    return !!data;
  } catch {
    return null; // cloud unreachable
  }
}

export async function incrementCloudCount(serverId: string): Promise<void> {
  try {
    const sb = await client();
    await sb.rpc("increment_server_count", { p_server_id: serverId });
  } catch (e) {
    console.error("[cloudSync] count failed", e);
  }
}
