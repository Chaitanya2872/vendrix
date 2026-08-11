import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Pencil, Plus, ShieldCheck, Tag, Trash2, X } from "lucide-react";
import { operationsApi, type UserProfile } from "@/api/operations";
import { useVendorCategories } from "@/contexts/VendorCategoryContext";
import { Busy, Empty, Panel, PageIntro, Problem } from "@/pages/Operations/operation-ui";

export function VendorCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useVendorCategories();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => { void operationsApi.me().then(setMe).catch(() => setError("Your profile could not be loaded.")).finally(() => setLoading(false)); }, []);
  const isAdmin = me?.role === "ADMIN";

  async function submitNew(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true); setActionError("");
    try { await addCategory(name); setNewName(""); }
    catch (err) { setActionError(isAxiosError(err) && err.response?.status === 409 ? "That category already exists." : "Category could not be created."); }
    finally { setSaving(false); }
  }

  async function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    try { await updateCategory(id, name); setEditingId(null); }
    catch { setActionError("Category could not be updated."); }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    setActionError("");
    try { await deleteCategory(id); }
    catch { setActionError("Category could not be deleted."); }
  }

  return <main className="space-y-5">
    <PageIntro eyebrow="Administration" title="Vendor categories" />
    {loading ? <Busy /> : error ? <Problem message={error} /> : <>
      {!isAdmin && <Panel className="p-4"><p className="m-0 text-sm text-brand-muted">You can view vendor categories. Only administrators can add, rename or remove them.</p></Panel>}
      {actionError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
      <Panel>
        <div className="flex items-center gap-2 border-b border-brand-border p-4"><Tag className="h-4 w-4 text-brand-gold-dark" /><p className="m-0 text-sm font-semibold text-brand-forest">Vendor category list</p></div>
        {!categories.length ? <Empty title="No vendor categories yet" detail="Add a category to make it available on the vendor form." /> : (
          <ul className="divide-y divide-brand-border">
            {categories.map(category => (
              <li key={category.id} className="flex items-center justify-between gap-3 px-5 py-3">
                {editingId === category.id ? (
                  <input value={editingName} onChange={e => setEditingName(e.target.value)} autoFocus className="h-9 flex-1 rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-forest" />
                ) : <span className="text-sm font-medium text-brand-text">{category.name}</span>}
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    {editingId === category.id ? (
                      <>
                        <button type="button" onClick={() => void saveEdit(category.id)} className="rounded-lg p-2 text-brand-forest hover:bg-brand-background"><ShieldCheck className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-2 text-brand-muted hover:bg-brand-background"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name); }} className="rounded-lg p-2 text-brand-muted hover:bg-brand-background hover:text-brand-forest"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => void remove(category.id, category.name)} className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {isAdmin && (
          <form onSubmit={submitNew} className="flex gap-2 border-t border-brand-border p-4">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name" className="h-10 flex-1 rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-forest" />
            <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-forest px-4 text-sm font-medium text-white hover:bg-brand-forest-light disabled:opacity-50"><Plus className="h-4 w-4" />{saving ? "Adding…" : "Add"}</button>
          </form>
        )}
      </Panel>
    </>}
  </main>;
}
