import { useMemo, useState } from "react";
import { FileText, Folder, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useVendors } from "@/contexts/VendorContext";

type DocumentStatus = "Valid" | "Expiring soon" | "Expired" | "Under review";

type VendorDocument = {
  id: string;
  name: string;
  vendorId: string;
  category: string;
  uploadedOn: string;
  expiresOn: string | null;
  status: DocumentStatus;
};

const documents: VendorDocument[] = [
  { id: "doc-001", name: "ISO 27001 Certificate", vendorId: "1", category: "Certification", uploadedOn: "2026-07-21", expiresOn: "2027-07-20", status: "Valid" },
  { id: "doc-002", name: "GST Registration", vendorId: "1", category: "Tax document", uploadedOn: "2026-06-15", expiresOn: null, status: "Valid" },
  { id: "doc-003", name: "Business Registration Certificate", vendorId: "2", category: "Legal document", uploadedOn: "2026-07-30", expiresOn: "2027-07-29", status: "Under review" },
  { id: "doc-004", name: "Product Liability Insurance", vendorId: "3", category: "Insurance", uploadedOn: "2026-05-12", expiresOn: "2026-08-14", status: "Expiring soon" },
  { id: "doc-005", name: "MSME Registration", vendorId: "3", category: "Certification", uploadedOn: "2026-04-08", expiresOn: null, status: "Valid" },
  { id: "doc-006", name: "Non-Disclosure Agreement", vendorId: "4", category: "Agreement", uploadedOn: "2025-07-29", expiresOn: "2026-07-28", status: "Expired" },
  { id: "doc-007", name: "Transporter Licence", vendorId: "5", category: "Legal document", uploadedOn: "2026-07-02", expiresOn: "2027-07-01", status: "Valid" },
  { id: "doc-008", name: "Employee Safety Policy", vendorId: "6", category: "Policy", uploadedOn: "2026-07-26", expiresOn: "2026-12-31", status: "Under review" },
];

const folderGroups = [
  { name: "Compliance & certificates", categories: ["Certification", "Policy"], size: "184 MB" },
  { name: "Legal & tax", categories: ["Legal document", "Tax document"], size: "96 MB" },
  { name: "Insurance", categories: ["Insurance"], size: "42 MB" },
  { name: "Agreements", categories: ["Agreement"], size: "28 MB" },
];

const statusClasses: Record<DocumentStatus, string> = {
  Valid: "bg-emerald-50 text-emerald-700",
  "Expiring soon": "bg-amber-50 text-amber-700",
  Expired: "bg-red-50 text-red-700",
  "Under review": "bg-sky-50 text-sky-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function DocumentsPage() {
  const { vendors } = useVendors();
  const [vendorId, setVendorId] = useState("all");
  const [vendorType, setVendorType] = useState("all");
  const [query, setQuery] = useState("");
  const [uploadNotice, setUploadNotice] = useState(false);

  const vendorById = useMemo(() => new Map(vendors.map(vendor => [vendor.id, vendor])), [vendors]);
  const vendorTypes = useMemo(() => [...new Set(vendors.map(vendor => vendor.category))], [vendors]);
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter(document => {
      const vendor = vendorById.get(document.vendorId);
      return (vendorId === "all" || document.vendorId === vendorId)
        && (vendorType === "all" || vendor?.category === vendorType)
        && (!normalizedQuery || `${document.name} ${document.category} ${vendor?.name ?? ""}`.toLowerCase().includes(normalizedQuery));
    });
  }, [query, vendorById, vendorId, vendorType]);

  const recentDocuments = useMemo(() => [...rows].sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn)).slice(0, 3), [rows]);
  const filtersActive = vendorId !== "all" || vendorType !== "all" || Boolean(query);
  const clearFilters = () => { setVendorId("all"); setVendorType("all"); setQuery(""); };

  return <div className="space-y-7 pb-4">
    <header className="border-b border-brand-border pb-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-dark">Vendor workspace</p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-brand-forest">Documents</h1>
          <p className="mb-0 mt-2 text-sm text-brand-muted">A clear view of vendor compliance files, contracts and supporting paperwork.</p>
        </div>
        <button onClick={() => setUploadNotice(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest">
          <Upload className="h-4 w-4" /> Upload document
        </button>
      </div>
    </header>

    {uploadNotice && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-white px-4 py-3 text-sm shadow-sm"><span><span className="font-medium text-brand-forest">Upload workspace coming next.</span> Documents are currently displayed from local records.</span><button onClick={() => setUploadNotice(false)} className="shrink-0 text-sm font-medium text-brand-forest hover:underline">Dismiss</button></div>}

    <section aria-label="Document filters" className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-3 shadow-sm xl:flex-row xl:items-center">
      <button onClick={() => setUploadNotice(true)} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-forest px-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-forest-light sm:hidden"><Upload className="h-4 w-4" /> New</button>
      <label className="sr-only" htmlFor="document-vendor">Vendor</label>
      <select id="document-vendor" value={vendorId} onChange={event => setVendorId(event.target.value)} className="h-10 min-w-0 rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/15 sm:min-w-48"><option value="all">All vendors</option>{vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select>
      <label className="sr-only" htmlFor="document-vendor-type">Vendor type</label>
      <select id="document-vendor-type" value={vendorType} onChange={event => setVendorType(event.target.value)} className="h-10 min-w-0 rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/15 sm:min-w-48"><option value="all">All vendor types</option>{vendorTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-brand-border bg-white px-3 focus-within:border-brand-forest focus-within:ring-2 focus-within:ring-brand-forest/15"><Search className="h-4 w-4 shrink-0 text-brand-muted" /><span className="sr-only">Search documents</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents" className="min-w-0 w-full border-0 bg-transparent text-sm outline-none placeholder:text-brand-muted" /></label>
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-brand-border pt-3 text-sm xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0"><SlidersHorizontal className="h-4 w-4 text-brand-gold-dark" /><span><strong className="text-brand-forest">{rows.length}</strong> {rows.length === 1 ? "file" : "files"}</span>{filtersActive && <button onClick={clearFilters} className="ml-1 whitespace-nowrap text-sm font-medium text-brand-forest hover:underline">Clear</button>}</div>
    </section>

    <section aria-labelledby="folders-heading">
      <div className="mb-3 flex items-baseline justify-between"><div><h2 id="folders-heading" className="m-0 text-lg font-semibold text-brand-forest">Folders</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Organise records by document purpose.</p></div><span className="text-xs text-brand-muted">{rows.length} files in view</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {folderGroups.map(folder => {
          const count = rows.filter(document => folder.categories.includes(document.category)).length;
          return <article key={folder.name} className="group min-h-40 rounded-xl border border-brand-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className="mb-5 flex h-11 w-12 items-end rounded-md px-2 pb-2" style={{ backgroundColor: "rgba(195, 156, 103, 0.16)" }}><Folder className="h-7 w-7 fill-current" style={{ color: "#C39C67" }} aria-hidden="true" /></span>
            <h3 className="m-0 text-sm font-semibold text-brand-text">{folder.name}</h3>
            <p className="mb-0 mt-1.5 text-sm text-brand-muted">{count} {count === 1 ? "file" : "files"} <span className="mx-1 text-brand-border">•</span> {folder.size}</p>
          </article>;
        })}
      </div>
    </section>

    <section aria-labelledby="recent-heading">
      <div className="mb-3 flex items-baseline justify-between"><div><h2 id="recent-heading" className="m-0 text-lg font-semibold text-brand-forest">Recent</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Latest files added to your current view.</p></div></div>
      <div className="grid gap-3 lg:grid-cols-3">
        {recentDocuments.map(document => { const vendor = vendorById.get(document.vendorId); return <article key={document.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-brand-border bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-background text-brand-gold-dark"><FileText className="h-4 w-4" /></span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-brand-text">{document.name}</h3><p className="mt-1 truncate text-xs text-brand-muted">{vendor?.name ?? "Unknown vendor"} <span className="mx-1">•</span> {formatDate(document.uploadedOn)}</p></div></article>; })}
        {!recentDocuments.length && <div className="col-span-full rounded-xl border border-dashed border-brand-border bg-white px-4 py-7 text-center text-sm text-brand-muted">No recent files match the selected filters.</div>}
      </div>
    </section>

    <section aria-labelledby="all-files-heading" className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-4"><div><h2 id="all-files-heading" className="m-0 text-lg font-semibold text-brand-forest">All files</h2><p className="mb-0 mt-1 text-sm text-brand-muted">Vendor document register</p></div><FileText className="h-5 w-5 text-brand-gold-dark" /></div>
      {!!rows.length && <div className="overflow-x-auto"><table className="w-full min-w-250 border-collapse text-left"><thead className="bg-brand-background/60 text-xs uppercase tracking-wide text-brand-muted"><tr><th className="px-5 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Vendor type</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Uploaded / expires</th><th className="px-5 py-3 font-medium">Status</th></tr></thead><tbody>{rows.map(document => { const vendor = vendorById.get(document.vendorId); return <tr key={document.id} className="border-t border-brand-border transition-colors hover:bg-brand-background/35"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-background text-brand-gold-dark"><FileText className="h-4 w-4" /></span><span className="text-sm font-medium text-brand-text">{document.name}</span></div></td><td className="px-4 py-3.5"><p className="m-0 text-sm font-medium text-brand-text">{vendor?.name ?? "Unknown vendor"}</p><p className="mb-0 mt-0.5 text-xs text-brand-muted">{vendor?.code}</p></td><td className="px-4 py-3.5 text-sm text-brand-muted">{vendor?.category ?? "—"}</td><td className="px-4 py-3.5 text-sm text-brand-muted">{document.category}</td><td className="px-4 py-3.5"><p className="m-0 text-sm text-brand-text">{formatDate(document.uploadedOn)}</p><p className="mb-0 mt-0.5 text-xs text-brand-muted">{document.expiresOn ? `Expires ${formatDate(document.expiresOn)}` : "No expiry date"}</p></td><td className="px-5 py-3.5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[document.status]}`}>{document.status}</span></td></tr>; })}</tbody></table></div>}
      {!rows.length && <div className="flex flex-col items-center px-5 py-16 text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-background text-brand-gold-dark"><Search className="h-5 w-5" /></span><p className="m-0 text-sm font-medium text-brand-forest">No documents match these filters</p><p className="mb-0 mt-1 text-sm text-brand-muted">Try another vendor or vendor type, or clear your filters.</p><button onClick={clearFilters} className="mt-4 text-sm font-medium text-brand-forest hover:underline">Clear all filters</button></div>}
      {!!rows.length && <footer className="border-t border-brand-border px-5 py-3 text-xs text-brand-muted">Showing {rows.length} of {documents.length} documents</footer>}
    </section>
  </div>;
}
