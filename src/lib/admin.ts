const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "@Voltron0120";
const SESSION_KEY = "voltron_admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  username: string;
  loginAt: number;
  expiresAt: number;
}

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const now = Date.now();
    const session: AdminSession = {
      username,
      loginAt: now,
      expiresAt: now + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

export function adminLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session: AdminSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  return getAdminSession() !== null;
}
