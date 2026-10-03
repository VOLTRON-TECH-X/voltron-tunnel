import { useState } from "react";
import { Eye, EyeOff, Megaphone, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deletePublicNotice,
  getContactConfig,
  getPublicNotices,
  saveContactConfig,
  savePublicNotice,
  togglePublicNotice,
  type PublicNotice,
} from "@/lib/siteConfig";

const emptyNotice = { title: "", message: "" };

export function SiteContentManager() {
  const [contacts, setContacts] = useState(getContactConfig);
  const [notices, setNotices] = useState<PublicNotice[]>(getPublicNotices);
  const [form, setForm] = useState(emptyNotice);
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = () => setNotices(getPublicNotices());

  const saveContacts = () => {
    saveContactConfig({ telegram: contacts.telegram.trim(), whatsapp: contacts.whatsapp.trim() });
    toast.success("Contact details saved");
  };

  const submitNotice = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Add both a title and message");
      return;
    }
    savePublicNotice({
      ...(editId ? { id: editId } : {}),
      title: form.title.trim(),
      message: form.message.trim(),
      enabled: true,
    });
    setForm(emptyNotice);
    setEditId(null);
    refresh();
    toast.success(editId ? "Notice updated" : "Notice published");
  };

  const remove = (notice: PublicNotice) => {
    if (!confirm(`Delete “${notice.title}”?`)) return;
    deletePublicNotice(notice.id);
    refresh();
    toast.success("Notice deleted");
  };

  return (
    <section className="surface p-4">
      <div className="flex items-center gap-2">
        <Megaphone className="size-4 text-admin" />
        <h2 className="font-display font-semibold">Contacts & public notices</h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-muted-foreground">
          Telegram username or link
          <input
            value={contacts.telegram}
            onChange={(event) => setContacts({ ...contacts, telegram: event.target.value })}
            placeholder="@username or https://t.me/username"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          WhatsApp number or link
          <input
            value={contacts.whatsapp}
            onChange={(event) => setContacts({ ...contacts, whatsapp: event.target.value })}
            placeholder="255… or https://wa.me/…"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <Button className="mt-3" onClick={saveContacts}><Save /> Save contacts</Button>

      <div className="my-5 border-t border-border" />

      <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Notice title"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Information users should see"
          rows={3}
          className="resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={submitNotice}><Plus /> {editId ? "Save changes" : "Publish notice"}</Button>
        {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm(emptyNotice); }}>Cancel</Button>}
      </div>

      <div className="mt-4 space-y-2">
        {notices.length === 0 && <p className="rounded-lg bg-secondary/40 p-4 text-sm text-muted-foreground">No public notices yet.</p>}
        {notices.map((notice) => (
          <div key={notice.id} className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/25 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{notice.title}</p>
                <span className={`text-xs font-medium ${notice.enabled ? "text-success" : "text-muted-foreground"}`}>
                  {notice.enabled ? "Visible" : "Hidden"}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{notice.message}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="icon" variant="outline" title={notice.enabled ? "Hide notice" : "Show notice"} aria-label={notice.enabled ? "Hide notice" : "Show notice"} onClick={() => { togglePublicNotice(notice.id, !notice.enabled); refresh(); }}>
                {notice.enabled ? <EyeOff /> : <Eye />}
              </Button>
              <Button size="icon" variant="outline" title="Edit notice" aria-label="Edit notice" onClick={() => { setEditId(notice.id); setForm({ title: notice.title, message: notice.message }); }}><Pencil /></Button>
              <Button size="icon" variant="destructive" title="Delete notice" aria-label="Delete notice" onClick={() => remove(notice)}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SiteContentManager;