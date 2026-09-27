const KEY = "voltron_api_config";

export interface ApiConfig {
  apiUrl?: string | undefined;
  apiKey?: string | undefined;
}

export function getApiConfig(): ApiConfig {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveApiConfig(cfg: ApiConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function clearApiConfig() {
  localStorage.removeItem(KEY);
}

export function getApiUrl(): string {
  return getApiConfig().apiUrl || import.meta.env["VITE_API_URL"] || "https://api.voltrontechtx.shop";
}

export function getApiKey(): string | undefined {
  return getApiConfig().apiKey || import.meta.env["VITE_API_KEY"];
}
