import { useState, type FormEvent } from "react";
import type { VendorInput, VendorStatus } from "@/types/vendor";

const emptyVendor: VendorInput = {
  name:"", category:"", contactPerson:"", email:"", phone:"", gstin:"", address:"", city:"", state:"", status:"Pending", rating:0, notes:"",
};

export function VendorForm({ initialValue, submitLabel, onSubmit, onCancel }: {
  initialValue?: VendorInput;
  submitLabel: string;
  onSubmit: (value: VendorInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<VendorInput>(initialValue ?? emptyVendor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof VendorInput>(key: K, value: VendorInput[K]) => setForm(current => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Vendor name is required";
    if (!form.category.trim()) next.category = "Category is required";
    if (!form.contactPerson.trim()) next.contactPerson = "Contact person is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(form);
  }

  const field = (label: string, key: keyof VendorInput, type = "text", required = false) => (
    <label className="space-y-1.5 text-sm font-medium text-brand-text">
      <span>{label}{required && <span className="text-red-500"> *</span>}</span>
      <input type={type} value={String(form[key])} onChange={e => set(key, (key === "rating" ? Number(e.target.value) : e.target.value) as never)}
        className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" />
      {errors[key] && <span className="text-xs font-normal text-red-600">{errors[key]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Company information</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Vendor name", "name", "text", true)}{field("Category", "category", "text", true)}{field("GSTIN", "gstin")}{field("Rating", "rating", "number")}</div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Primary contact</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Contact person", "contactPerson", "text", true)}{field("Email", "email", "email", true)}{field("Phone", "phone", "text", true)}
          <label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Status</span><select value={form.status} onChange={e => set("status", e.target.value as VendorStatus)} className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-forest"><option>Active</option><option>Pending</option><option>Inactive</option></select></label>
        </div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Address and notes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Address", "address")}{field("City", "city")}{field("State", "state")}
          <label className="space-y-1.5 text-sm font-medium text-brand-text md:col-span-2"><span>Notes</span><textarea rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full resize-none rounded-lg border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /></label>
        </div>
      </section>
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="h-10 rounded-lg border border-brand-border bg-white px-4 text-sm font-medium hover:bg-brand-background">Cancel</button><button className="h-10 rounded-lg bg-brand-forest px-5 text-sm font-medium text-white hover:bg-brand-forest-light">{submitLabel}</button></div>
    </form>
  );
}
