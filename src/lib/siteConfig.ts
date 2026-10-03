export type ContactConfig = {
  telegram: string;
  whatsapp: string;
};

export type PublicNotice = {
  id: string;
  title: string;
  message: string;
  enabled: boolean;
  createdAt: string;
};

const CONTACT_KEY = "voltron_contact_config";
const NOTICES_KEY = "voltron_public_notices";

const defaults: ContactConfig = {
  telegram: "https://t.me/voltrontechtx",
  whatsapp: "",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function notify() {
  window.dispatchEvent(new Event("voltron-site-config-change"));
}

export function getContactConfig(): ContactConfig {
  return readJson(CONTACT_KEY, defaults);
}

export function saveContactConfig(config: ContactConfig) {
  localStorage.setItem(CONTACT_KEY, JSON.stringify(config));
  notify();
}

export function getPublicNotices(): PublicNotice[] {
  return readJson<PublicNotice[]>(NOTICES_KEY, []);
}

export function savePublicNotice(notice: Omit<PublicNotice, "id" | "createdAt"> & { id?: string }) {
  const notices = getPublicNotices();
  if (notice.id) {
    localStorage.setItem(
      NOTICES_KEY,
      JSON.stringify(notices.map((item) => item.id === notice.id ? { ...item, ...notice } : item)),
    );
  } else {
    localStorage.setItem(NOTICES_KEY, JSON.stringify([
      ...notices,
      { ...notice, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]));
  }
  notify();
}

export function deletePublicNotice(id: string) {
  localStorage.setItem(NOTICES_KEY, JSON.stringify(getPublicNotices().filter((item) => item.id !== id)));
  notify();
}

export function togglePublicNotice(id: string, enabled: boolean) {
  localStorage.setItem(
    NOTICES_KEY,
    JSON.stringify(getPublicNotices().map((item) => item.id === id ? { ...item, enabled } : item)),
  );
  notify();
}

export function contactHref(kind: keyof ContactConfig, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (kind === "telegram") return `https://t.me/${trimmed.replace(/^@/, "")}`;
  return `https://wa.me/${trimmed.replace(/\D/g, "")}`;
}