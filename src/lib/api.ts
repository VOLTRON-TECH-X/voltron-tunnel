const API_URL = import.meta.env.VITE_API_URL || "https://api.voltrontechtx.shop";
const API_KEY = import.meta.env.VITE_API_KEY;

export interface ApiResponse {
  success?: boolean;
  available?: boolean;
  error?: string;
  message?: string;
  account?: Account;
  protocols?: Record<string, Protocol>;
  protocol_count?: number;
  count?: number;
  users?: Account[];
  total?: number;
  info?: any;
  [key: string]: any;
}

export interface Account {
  username: string;
  password?: string;
  expiry: string;
  days?: number;
  days_left?: number;
  limit: number;
  bandwidth?: string;
  server?: string;
  server_ip?: string;
  status?: string;
  online?: number;
  bandwidth_used_gb?: number;
  bandwidth_limit?: number;
}

export interface Protocol {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: string;
  host?: string;
  ip?: string;
  port?: number;
  port_range?: string;
  exclude?: string;
  domain?: string;
  pubkey?: string;
  mtu?: number;
  dns?: string;
  dns_alt?: string;
  username?: string;
  password?: string;
  limit?: number;
  info?: string;
}

export async function apiCall(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  data: any = null,
): Promise<ApiResponse> {
  if (!API_KEY) {
    return { success: false, error: "API key missing in .env" };
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
  };
  if (data && method === "POST") options.body = JSON.stringify(data);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || `HTTP ${res.status}` };
    return json;
  } catch (e: any) {
    console.error("[api]", endpoint, e);
    return { success: false, error: e?.message || "Network error" };
  }
}

// Public
export const checkUsername = (username: string) =>
  apiCall("/api/trial/check", "POST", { username });

export const createAccount = (username: string, password: string, days: number) =>
  apiCall("/api/trial/create", "POST", { username, password, days });

export const getAccountStatus = (username: string) =>
  apiCall(`/api/trial/status/${username}`, "GET");

export const getProtocols = () => apiCall("/api/protocols/status", "GET");

// Admin
export const getAllUsers = () => apiCall("/api/users/list", "GET");

export const deleteUser = (username: string) =>
  apiCall("/api/users/delete", "POST", { username });

export const lockUser = (username: string) => apiCall("/api/users/lock", "POST", { username });

export const unlockUser = (username: string) =>
  apiCall("/api/users/unlock", "POST", { username });

export const getDashboardInfo = () => apiCall("/api/dashboard/info", "GET");
