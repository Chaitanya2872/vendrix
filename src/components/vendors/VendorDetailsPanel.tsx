import { Building2, Mail, MapPin, Phone, Star } from "lucide-react";
import type { Vendor } from "@/types/vendor";

export function VendorDetailsPanel({ vendor, onEdit, onDelete }: { vendor: Vendor; onEdit: () => void; onDelete: () => void }) {
  const initials = vendor.name.split(" ").map(word => word[0]).slice(0, 2).join("");
  return <div className="space-y-4">
    <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-background text-lg font-semibold text-brand-forest">{initials}</div><div className="min-w-0"><h3 className="m-0 truncate text-lg font-semibold text-brand-text">{vendor.name}</h3><p className="mb-0 mt-1 text-sm text-brand-muted">{vendor.code} · {vendor.category}</p><span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{vendor.status}</span></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><button onClick={onEdit} className="h-10 rounded-lg bg-brand-forest text-sm font-medium text-white hover:bg-brand-forest-light">Edit vendor</button><button onClick={onDelete} className="h-10 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50">Delete</button></div>
    </section>
    <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm"><h3 className="m-0 text-sm font-semibold text-brand-forest">Contact information</h3><div className="mt-4 space-y-4 text-sm"><Row icon={Mail} label="Email" value={vendor.email}/><Row icon={Phone} label="Phone" value={vendor.phone}/><Row icon={MapPin} label="Address" value={`${vendor.address}, ${vendor.city}, ${vendor.state}`}/></div></section>
    <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm"><h3 className="m-0 text-sm font-semibold text-brand-forest">Business information</h3><div className="mt-4 grid grid-cols-2 gap-5"><Info label="GSTIN" value={vendor.gstin || "Not provided"}/><Info label="Category" value={vendor.category}/><Info label="Registered" value={vendor.registeredOn}/><div><p className="m-0 text-xs text-brand-muted">Rating</p><p className="mb-0 mt-1 flex items-center gap-1 text-sm font-medium"><Star className="h-4 w-4 fill-brand-gold text-brand-gold"/>{vendor.rating || "Not rated"}</p></div></div></section>
    <section className="rounded-xl border border-brand-border bg-white p-5 shadow-sm"><h3 className="m-0 text-sm font-semibold text-brand-forest">Internal notes</h3><p className="mb-0 mt-3 text-sm leading-6 text-brand-muted">{vendor.notes || "No notes added."}</p></section>
  </div>;
}

function Row({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) { return <div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-background text-brand-forest"><Icon className="h-4 w-4"/></div><div className="min-w-0"><p className="m-0 text-xs text-brand-muted">{label}</p><p className="mb-0 mt-1 break-words font-medium text-brand-text">{value}</p></div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="m-0 text-xs text-brand-muted">{label}</p><p className="mb-0 mt-1 text-sm font-medium text-brand-text">{value}</p></div>; }
