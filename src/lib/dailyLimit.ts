import { pushKey } from "./cloudSync";

const LIMIT_KEY = "voltron_daily_limit";
const CONFIG_KEY = "voltron_daily_config";
const DEFAULT_LIMIT = parseInt(import.meta.env['VITE_DEFAULT_DAILY_LIMIT'] || "10", 10);

interface DailyConfig {
  limit: number;
  lastUpdated: number;
}

interface DailyState {
  count: number;
  windowStart: number;
}

const hasStorage = () => typeof window !== "undefined";

export function getDailyLimit(): number {
  if (!hasStorage()) return DEFAULT_LIMIT;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return DEFAULT_LIMIT;
  try {
    const config: DailyConfig = JSON.parse(raw);
    return config.limit;
  } catch {
    return DEFAULT_LIMIT;
  }
}

export function setDailyLimit(newLimit: number): void {
  if (!hasStorage()) return;
  if (newLimit < 1 || newLimit > 1000) return;
  const config: DailyConfig = { limit: newLimit, lastUpdated: Date.now() };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  void pushKey("voltron_daily_config");
}

export function getDailyState(): DailyState {
  const now = Date.now();
  if (!hasStorage()) return { count: 0, windowStart: now };
  const raw = localStorage.getItem(LIMIT_KEY);
  if (!raw) return { count: 0, windowStart: now };
  try {
    const state: DailyState = JSON.parse(raw);
    const hoursSince = (now - state.windowStart) / (1000 * 60 * 60);
    if (hoursSince >= 24) {
      const fresh: DailyState = { count: 0, windowStart: now };
      localStorage.setItem(LIMIT_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return state;
  } catch {
    return { count: 0, windowStart: now };
  }
}

export function incrementDailyCount(): void {
  if (!hasStorage()) return;
  const state = getDailyState();
  state.count += 1;
  localStorage.setItem(LIMIT_KEY, JSON.stringify(state));
}

export function canCreateAccount(): {
  allowed: boolean;
  remaining: number;
  resetIn: string;
  count: number;
  limit: number;
} {
  const state = getDailyState();
  const limit = getDailyLimit();
  const remaining = Math.max(0, limit - state.count);

  const windowEnd = state.windowStart + 24 * 60 * 60 * 1000;
  const msLeft = Math.max(0, windowEnd - Date.now());
  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  const resetIn = `${hours}h ${minutes}m`;

  return { allowed: remaining > 0, remaining, resetIn, count: state.count, limit };
}

export function resetDailyState(): void {
  if (!hasStorage()) return;
  localStorage.removeItem(LIMIT_KEY);
}
