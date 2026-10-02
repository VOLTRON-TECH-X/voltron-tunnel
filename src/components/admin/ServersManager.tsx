import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Server, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSelectedServerId, setSelectedServerId } from "@/lib/apiConfig";
import { deleteServer, listServers, saveServer, toggleServer, type LocalServer } from "@/lib/serverStore";

type Row = LocalServer;
const empty = { name: "", category: "Premium", api_url: "", api_key: "", daily_limit: "10", bandwidth_total_gb: "" };

export function ServersManager({ onSelect }: { onSelect: () => void }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | undefined>();
  const [saving] = useState(false);

  const load = useCallback(() => {
    const r = listServers();
    setRows(r);
    const cur = getSelectedServerId();
    if (r.length && !r.some((s) => s.id === cur)) setSelectedServerId(r[0]!.id);
    setSelected(getSelectedServerId());
  }, []);

  useEffect(() => { load(); }, [load]);

  const choose = (id: string) => {
    setSelectedServerId(id);
    setSelected(id);
    void qc.invalidateQueries();
    onSelect();
  };

  const save = () => {
    if (!/^https?:\/\//.test(form.api_url)) { toast.error("API domain must start with https://"); return; }
    saveServer({
      id: editId ?? undefined,
      name: form.name.trim(), category: form.category.trim() || "Premium",
      api_url: form.api_url.trim(), api_key: form.api_key.trim(),
      daily_limit: parseInt(form.daily_limit, 10) || 10,
      bandwidth_total_gb: form.bandwidth_total_gb ? parseFloat(form.bandwidth_total_gb) : null,
    });
    toast.success(editId ? "Server updated" : "Server added");
    setForm(empty); setEditId(null); load();
  };

  const toggle = (s: Row) => {
    toggleServer(s.id, !s.enabled);
    toast.success(`${s.name} is now ${s.enabled ? "offline" : "online"}`);
    load();
  };

  const remove = (s: Row) => {
    if (!confirm(`Delete server ${s.name}?`)) return;
    deleteServer(s.id);
    toast.success("Server deleted");
    load();
  };

  const categories = Array.from(new Set(rows.map((r) => r.category)));
  const input = "rounded-lg border border-input bg-background px-3 py-2 text-sm";

  return (
    <section className="surface p-4">
      <h2 className="flex items-center gap-2 font-display font-semibold"><Server className="size-4 text-admin" /> Servers (API domain & key)</h2>
      <p className="mt-1 text-xs text-muted-foreground">Each server is one API domain + key. Online servers are shown to users; the selected one is managed below.</p>

      {categories.map((cat) => (
        <div key={cat} className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
          <div className="space-y-2">
            {rows.filter((r) => r.category === cat).map((s) => (
              <div key={s.id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${selected === s.id ? "border-admin bg-admin/10" : "border-border bg-secondary/30"}`}>
                <button type="button" onClick={() => choose(s.id)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold">{s.name} {selected === s.id && <span className="ml-1 text-xs text-admin">• managing</span>}</p>
                  <p className="break-all text-xs text-muted-foreground">{s.api_url} · key ••••{s.api_key.slice(-4)} · limit {s.daily_limit}/day</p>
                </button>
                <button type="button" role="switch" aria-checked={s.enabled} aria-label={`Toggle ${s.name}`} onClick={() => toggle(s)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${s.enabled ? "bg-success" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-all ${s.enabled ? "left-[1.375rem]" : "left-0.5"}`} />
                </button>
                <span className={`text-xs font-semibold ${s.enabled ? "text-success" : "text-muted-foreground"}`}>{s.enabled ? "Online" : "Offline"}</span>
                <Button size="sm" variant="outline" onClick={() => { setEditId(s.id); setForm({ name: s.name, category: s.category, api_url: s.api_url, api_key: s.api_key, daily_limit: String(s.daily_limit), bandwidth_total_gb: s.bandwidth_total_gb != null ? String(s.bandwidth_total_gb) : "" }); }}><Pencil /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(s)}><Trash2 /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-5 rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-sm font-semibold">{editId ? "Edit server" : "Add server"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Name (e.g. Tanzania 1)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} placeholder="Category (e.g. Premium, Africa)" list="server-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <datalist id="server-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <input className={input} placeholder="API domain (https://api.example.com)" value={form.api_url} onChange={(e) => setForm({ ...form, api_url: e.target.value })} />
          <input className={input} placeholder="API key" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
          <input className={input} type="number" min={1} max={1000} placeholder="Accounts per day" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
          <input className={input} type="number" min={0} placeholder="Total bandwidth GB (optional)" value={form.bandwidth_total_gb} onChange={(e) => setForm({ ...form, bandwidth_total_gb: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={save} disabled={saving || !form.name || !form.api_url || !form.api_key}><Plus /> {editId ? "Save changes" : "Add server"}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</Button>}
        </div>
      </div>
    </section>
  );
}

export default ServersManager;
