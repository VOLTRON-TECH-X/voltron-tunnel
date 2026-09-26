import type { Account, Protocol } from "./api";

const LAST_KEY = "voltron_last_account";
const HISTORY_KEY = "voltron_account_history";

export interface StoredAccount {
  account: Account;
  protocols: Record<string, Protocol>;
  createdAt: number;
}

const hasStorage = () => typeof window !== "undefined";

export function saveLastAccount(data: StoredAccount) {
  if (!hasStorage()) return;
  localStorage.setItem(LAST_KEY, JSON.stringify(data));
  const history = getHistory();
  history[data.account.username] = data.account.password || "";
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getLastAccount(): StoredAccount | null {
  if (!hasStorage()) return null;
  const raw = localStorage.getItem(LAST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAccount;
  } catch {
    return null;
  }
}

export function getHistory(): Record<string, string> {
  if (!hasStorage()) return {};
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}
