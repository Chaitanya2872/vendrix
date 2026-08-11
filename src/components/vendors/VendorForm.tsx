import { useEffect, useState, type FormEvent } from "react";
import type { VendorInput, VendorStatus } from "@/types/vendor";
import { useVendorCategories } from "@/contexts/VendorCategoryContext";

type Place = { display_name: string; address: { city?: string; town?: string; village?: string; county?: string; state?: string } };

const emptyVendor: VendorInput = {
  code:"", name:"", category:"", contactPerson:"", email:"", phone:"", gstin:"", address:"", city:"", state:"", status:"Pending", rating:0, notes:"", paymentTerms:"", creditLimit:"", billingDetails:"", serviceDescription:"", deliveryTimeline:"", taxDocuments:"", certificationStatus:"Not submitted",
};

export function VendorForm({ initialValue, submitLabel, onSubmit, onCancel }: {
  initialValue?: VendorInput;
  submitLabel: string;
  onSubmit: (value: VendorInput) => void;
  onCancel: () => void;
}) {
  const { categories } = useVendorCategories();
  const [form, setForm] = useState<VendorInput>(initialValue ?? emptyVendor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const set = <K extends keyof VendorInput>(key: K, value: VendorInput[K]) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    const query = form.address.trim();
    if (query.length < 3) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`, { signal: controller.signal });
        setSuggestions(response.ok ? await response.json() : []);
      } catch { if (!controller.signal.aborted) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setSearchingAddress(false); }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [form.address]);

  const selectPlace = (place: Place) => { setForm(current => ({ ...current, address: place.display_name, city: place.address.city || place.address.town || place.address.village || place.address.county || current.city, state: place.address.state || current.state })); setSuggestions([]); };

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
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Vendor name", "name", "text", true)}<label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Vendor code</span><input type="text" value={form.code ?? ""} onChange={e => set("code", e.target.value)} placeholder="Leave blank to auto-generate" className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /><span className="block text-xs font-normal text-brand-muted">Must be unique. Leave blank to auto-generate a code.</span></label><label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Category <span className="text-red-500">*</span></span><select value={form.category} onChange={e => set("category", e.target.value)} className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10"><option value="" disabled>Select category</option>{categories.map(category => <option key={category.id}>{category.name}</option>)}</select>{errors.category && <span className="text-xs font-normal text-red-600">{errors.category}</span>}</label>{field("GSTIN", "gstin")}{field("Rating", "rating", "number")}</div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Primary contact</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Contact person", "contactPerson", "text", true)}{field("Email", "email", "email", true)}{field("Phone", "phone", "text", true)}
          <label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Status</span><select value={form.status} onChange={e => set("status", e.target.value as VendorStatus)} className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-forest"><option>Active</option><option>Pending</option><option>Inactive</option></select></label>
        </div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Address and notes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="relative space-y-1.5 text-sm font-medium text-brand-text md:col-span-2"><span>Address search</span><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Start typing an address (3+ characters)" autoComplete="off" className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10"/>{suggestions.length > 0 && <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-brand-border bg-white py-1 shadow-lg">{suggestions.map(place => <li key={place.display_name}><button type="button" onClick={() => selectPlace(place)} className="w-full px-3 py-2 text-left text-sm text-brand-text hover:bg-brand-background">{place.display_name}</button></li>)}</ul>}<span className="block text-xs font-normal text-brand-muted">{searchingAddress ? "Searching OpenStreetMap…" : "OpenStreetMap suggestions start after 3 characters and populate city and state."}</span></label>{field("City", "city")}{field("State", "state")}
          <label className="space-y-1.5 text-sm font-medium text-brand-text md:col-span-2"><span>Notes</span><textarea rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full resize-none rounded-lg border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /></label>
        </div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Financial</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Payment terms, credit limits, and billing details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{field("Payment terms", "paymentTerms", "text")}{field("Credit limit", "creditLimit", "text")}<label className="space-y-1.5 text-sm font-medium text-brand-text md:col-span-2"><span>Billing details</span><textarea rows={3} value={form.billingDetails} onChange={e => set("billingDetails", e.target.value)} className="w-full resize-none rounded-lg border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /></label></div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Operational</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Service descriptions and delivery timelines.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Service description</span><textarea rows={3} value={form.serviceDescription} onChange={e => set("serviceDescription", e.target.value)} className="w-full resize-none rounded-lg border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /></label>{field("Delivery timeline", "deliveryTimeline", "text")}</div>
      </section>
      <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-brand-forest">Compliance</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Tax documents and certification status.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Tax documents</span><textarea rows={3} value={form.taxDocuments} onChange={e => set("taxDocuments", e.target.value)} placeholder="GST certificate, PAN, TDS declaration…" className="w-full resize-none rounded-lg border border-brand-border bg-white p-3 text-sm outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10" /></label><label className="space-y-1.5 text-sm font-medium text-brand-text"><span>Certification status</span><select value={form.certificationStatus} onChange={e => set("certificationStatus", e.target.value)} className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-forest"><option>Not submitted</option><option>Under review</option><option>Verified</option><option>Expired</option></select></label></div>
      </section>
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="h-10 rounded-lg border border-brand-border bg-white px-4 text-sm font-medium hover:bg-brand-background">Cancel</button><button className="h-10 rounded-lg bg-brand-forest px-5 text-sm font-medium text-white hover:bg-brand-forest-light">{submitLabel}</button></div>
    </form>
  );
}
