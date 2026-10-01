// Selected server (API domain + key live on the backend; browser only knows the id).
const KEY = "voltron_selected_server";

export function getSelectedServerId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(KEY) || undefined;
}

export function setSelectedServerId(id: string) {
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new Event("voltron-server-change"));
}
