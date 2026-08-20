/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { VendorDrawer } from "@/components/vendors/VendorDrawer";
import { VendorDetailsPanel } from "@/components/vendors/VendorDetailsPanel";
import { VendorForm } from "@/components/vendors/VendorForm";
import { useVendors } from "@/contexts/VendorContext";
import { FilterBar } from "@/components/common/FilterBar";
import { facetFrom, useFilters } from "@/hooks/useFilters";
import type { Vendor, VendorInput, VendorStatus } from "@/types/vendor";

type DrawerState = { mode: "closed" } | { mode: "add" } | { mode: "details" | "edit"; vendorId: string };
const tabs = ["All", "Active", "Pending", "Inactive"] as const;
const badge: Record<VendorStatus, string> = { Active:"bg-emerald-50 text-emerald-700", Pending:"bg-amber-50 text-amber-700", Inactive:"bg-slate-100 text-slate-600" };

export function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor, getVendor } = useVendors();
  const [drawer, setDrawer] = useState<DrawerState>({ mode:"closed" });
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<(typeof tabs)[number]>("All");
  const categories = [...new Set(vendors.map(v => v.category))];

  // Status stays a tab row rather than moving into the panel: it is how
  // people navigate this page, and burying the most-used control one click
  // deep to make the filter set tidy would be a worse screen.
  const filters = useFilters({
    facets: [
      { key: "category", label: "Category", options: facetFrom(vendors, v => v.category) },
      { key: "state",    label: "State",    options: facetFrom(vendors, v => v.state) },
      { key: "city",     label: "City",     options: facetFrom(vendors, v => v.city) },
    ],
    dates: [{ key: "registered", label: "Registered" }],
  });

  const { matches } = filters;
  const rows = useMemo(() => vendors.filter(v =>
    (status === "All" || v.status === status)
    && matches({ category: v.category, state: v.state, city: v.city, registered: v.registeredOn })
    && `${v.name} ${v.code} ${v.contactPerson} ${v.email}`.toLowerCase().includes(query.toLowerCase())
  ), [vendors, status, matches, query]);
  const selected = drawer.mode === "details" || drawer.mode === "edit" ? getVendor(drawer.vendorId) : undefined;
  const close = () => setDrawer({ mode:"closed" });
  const editValue = (vendor: Vendor): VendorInput => { const { id:_id,registeredOn:_date,...value }=vendor; return value; };

  function exportCsv() { const csv=["Code,Name,Category,Contact,Email,Phone,Status",...rows.map(v=>[v.code,v.name,v.category,v.contactPerson,v.email,v.phone,v.status].map(x=>`"${x}"`).join(","))].join("\n"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); const link=document.createElement("a");link.href=url;link.download="vendors.csv";link.click();URL.revokeObjectURL(url); }
  function remove(vendor: Vendor) { if (window.confirm(`Delete ${vendor.name}?`)) { void deleteVendor(vendor.id); close(); } }

  return <div className="space-y-5">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="m-0 text-2xl font-semibold text-brand-forest">Vendors</h1><p className="mb-0 mt-1 text-sm text-brand-muted">Manage vendor profiles, onboarding and compliance.</p></div><div className="flex gap-2"><button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-border bg-white px-4 text-sm font-medium hover:bg-brand-background"><Download className="h-4 w-4"/>Export</button><button onClick={()=>setDrawer({mode:"add"})} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-forest px-4 text-sm font-medium text-white hover:bg-brand-forest-light"><Plus className="h-4 w-4"/>Add vendor</button></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total vendors",vendors.length,"All registered vendors"],["Active",vendors.filter(v=>v.status==="Active").length,"Currently approved"],["Pending",vendors.filter(v=>v.status==="Pending").length,"Awaiting review"],["Categories",categories.length,"Vendor business types"]].map(([label,value,note])=><article key={label} className="flex h-24 items-center justify-between rounded-xl border border-brand-border bg-white p-4 shadow-sm"><div><p className="m-0 text-2xl font-semibold text-brand-forest">{value}</p><p className="mb-0 mt-1 text-sm font-medium">{label}</p><p className="mb-0 mt-0.5 text-xs text-brand-muted">{note}</p></div><div className="h-10 w-1 rounded-full bg-brand-gold"/></article>)}</section>
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-brand-border p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-1 overflow-auto">{tabs.map(tab=><button key={tab} onClick={()=>setStatus(tab)} className={`h-9 rounded-lg px-3 text-sm font-medium ${status===tab?"bg-brand-background text-brand-forest":"text-brand-muted hover:bg-brand-background/60"}`}>{tab}</button>)}</div><div className="flex flex-col gap-2 sm:flex-row"><div className="flex h-10 items-center gap-2 rounded-lg border border-brand-border px-3 sm:w-72"><Search className="h-4 w-4 text-brand-muted"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search vendors..." className="w-full border-0 bg-transparent text-sm outline-none"/></div><FilterBar filters={filters}/></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-250 border-collapse text-left"><thead className="bg-brand-background/50 text-xs uppercase text-brand-muted"><tr><th className="px-5 py-3">Vendor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody>{rows.map(v=><tr key={v.id} onDoubleClick={()=>setDrawer({mode:"details",vendorId:v.id})} className="border-t border-brand-border hover:bg-brand-background/30"><td className="px-5 py-3.5"><p className="m-0 text-sm font-medium">{v.name}</p><p className="mb-0 mt-0.5 text-xs text-brand-muted">{v.code}</p></td><td className="px-4 py-3.5 text-sm text-brand-muted">{v.category}</td><td className="px-4 py-3.5"><p className="m-0 text-sm">{v.contactPerson}</p><p className="mb-0 mt-0.5 text-xs text-brand-muted">{v.email}</p></td><td className="px-4 py-3.5 text-sm text-brand-muted">{v.city}, {v.state}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[v.status]}`}>{v.status}</span></td><td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button title="View" onClick={()=>setDrawer({mode:"details",vendorId:v.id})} className="rounded-lg p-2 text-brand-muted hover:bg-brand-background hover:text-brand-forest"><Eye className="h-4 w-4"/></button><button title="Edit" onClick={()=>setDrawer({mode:"edit",vendorId:v.id})} className="rounded-lg p-2 text-brand-muted hover:bg-brand-background hover:text-brand-forest"><Pencil className="h-4 w-4"/></button><button title="Delete" onClick={()=>remove(v)} className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table>{!rows.length&&<div className="py-16 text-center text-sm text-brand-muted">{vendors.length?"No vendors match the selected filters.":"No vendors yet. Add one to get started."}</div>}</div><footer className="border-t border-brand-border px-5 py-3 text-xs text-brand-muted">Showing {rows.length} of {vendors.length} vendors</footer></section>

    <VendorDrawer open={drawer.mode==="add"} title="Add vendor" subtitle="Create a new vendor profile" onClose={close}><VendorForm submitLabel="Create vendor" onCancel={close} onSubmit={async input=>{const created=await addVendor(input);setDrawer({mode:"details",vendorId:created.id});}}/></VendorDrawer>
    <VendorDrawer open={drawer.mode==="edit" && !!selected} title="Edit vendor" subtitle={selected?.name} onClose={close}>{selected&&<VendorForm initialValue={editValue(selected)} submitLabel="Save changes" onCancel={close} onSubmit={async input=>{await updateVendor(selected.id,input);setDrawer({mode:"details",vendorId:selected.id});}}/>}</VendorDrawer>
    <VendorDrawer open={drawer.mode==="details" && !!selected} title="Vendor details" subtitle={selected?.code} width="max-w-lg" onClose={close}>{selected&&<VendorDetailsPanel vendor={selected} onEdit={()=>setDrawer({mode:"edit",vendorId:selected.id})} onDelete={()=>remove(selected)}/>}</VendorDrawer>
  </div>;
}
