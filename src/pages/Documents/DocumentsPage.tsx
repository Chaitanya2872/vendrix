/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState, useRef, useEffect } from "react";
import {
  FileText, Folder, Search, SlidersHorizontal, ChevronDown, Plus, X,
  Clock, AlertCircle, CheckCircle, FileWarning, Edit, ShieldCheck,
} from "lucide-react";
import { useVendors } from "@/contexts/VendorContext";
import { DocumentPreview } from "../../components/documents/document_preview";
import { UploadDocumentModal, type UploadPayload } from "../../components/documents/uploaddocument";
import { deleteDocument, downloadDocument, extractionState, getDocument, listDocuments, toDocumentUiStatus, uploadDocument, type ApiDocument, type ExtractedInvoiceFields } from "@/api/documents";
import { useNavigate } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type DocumentStatus = "Valid" | "Expiring soon" | "Expired" | "Under review" | "Draft";
export type VendorDocument = {
  id: string; name: string; vendorId: string; category: string;
  uploadedOn: string; expiresOn: string | null; status: DocumentStatus;
  size: string; lastModified: string; starred?: boolean; tags?: string[]; uploadedBy?: string;
  documentType?: string; extractedFields?: ExtractedInvoiceFields;
  /** Backend status verbatim. `status` above collapses PROCESSING and
   * REVIEW_REQUIRED into "Under review", which is right for a badge and
   * wrong for deciding whether extraction is still running. */
  rawStatus?: string;
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const mockDocuments: VendorDocument[] = [
  { id:"doc-001", name:"ISO 27001 Certificate",  vendorId:"1", category:"Certification",  uploadedOn:"2026-07-21", expiresOn:"2027-07-20", status:"Valid",         size:"2.4 MB",  lastModified:"2026-07-21T14:30:00", starred:true, tags:["security","certification"],   uploadedBy:"Cameron Williamson" },
  { id:"doc-002", name:"GST Registration",        vendorId:"1", category:"Tax document",   uploadedOn:"2026-06-15", expiresOn:null,          status:"Valid",         size:"856 KB",  lastModified:"2026-06-15T09:15:00",              tags:["tax","registration"],           uploadedBy:"Jenny Wilson"        },
  { id:"doc-003", name:"Analysis Data July",      vendorId:"1", category:"Policy",         uploadedOn:"2023-08-05", expiresOn:null,          status:"Under review",  size:"1.0 MB",  lastModified:"2023-08-05T10:00:00",              tags:["policy","data"],                uploadedBy:"Floyd Miles"         },
  { id:"doc-004", name:"Q2 Results",              vendorId:"1", category:"Agreement",      uploadedOn:"2023-07-31", expiresOn:null,          status:"Expiring soon", size:"2.5 MB",  lastModified:"2023-07-31T08:00:00",              tags:["agreement","quarterly"],        uploadedBy:"Kristin Watson"      },
  { id:"doc-005", name:"Sequence Data",           vendorId:"1", category:"Insurance",      uploadedOn:"2023-07-10", expiresOn:"2024-07-10",  status:"Valid",         size:"3.1 MB",  lastModified:"2023-07-10T11:30:00",              tags:["insurance"],                    uploadedBy:"Cameron Williamson" },
  { id:"doc-006", name:"Q4 Results",              vendorId:"1", category:"Certification",  uploadedOn:"2023-06-20", expiresOn:null,          status:"Draft",         size:"1.7 MB",  lastModified:"2023-06-20T14:00:00",              tags:["certification","quarterly"],    uploadedBy:"Jenny Wilson"        },
  { id:"doc-007", name:"Analysis Data April",     vendorId:"1", category:"Legal document", uploadedOn:"2023-05-15", expiresOn:null,          status:"Expired",       size:"900 KB",  lastModified:"2023-05-15T09:00:00",              tags:["legal","data"],                 uploadedBy:"Floyd Miles"         },
];

const folderGroups = [
  { name:"Results 2023",    categories:["Certification","Policy"],        size:"137 MB" },
  { name:"Market Analysis", categories:["Legal document","Tax document"], size:"56 MB"  },
  { name:"All contract",    categories:["Insurance","Agreement"],         size:"92 MB"  },
  { name:"Archived",        categories:["Draft"],                         size:"267 MB" },
];

const SORT_OPTS = [
  { value:"latest", label:"Latest first" },
  { value:"oldest", label:"Oldest first" },
  { value:"name",   label:"Name A–Z"     },
];

const DATE_OPTS = [
  { value:"any",    label:"Any time"      },
  { value:"7d",     label:"Last 7 days"   },
  { value:"30d",    label:"Last 30 days"  },
  { value:"3m",     label:"Last 3 months" },
  { value:"1y",     label:"Last year"     },
  { value:"custom", label:"Custom range"  },
];

const UNASSIGNED_VENDOR = "__none__";

/** Local yyyy-mm-dd. `toISOString()` is UTC, which shifts the boundary by a
 * day for anyone east or west of Greenwich — and the dates being compared
 * here were themselves written down in local time. */
function isoDay(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

/** The inclusive [from, to] window a date filter selects, as yyyy-mm-dd
 * strings so comparison is a plain string compare against `uploadedOn`. An
 * open end is undefined rather than a sentinel date. */
function dateWindow(mode: string, from: string, to: string): { from?: string; to?: string } {
  if (mode === "custom") return { from: from || undefined, to: to || undefined };
  if (mode === "any") return {};
  const cutoff = new Date();
  if (mode === "7d")  cutoff.setDate(cutoff.getDate() - 7);
  if (mode === "30d") cutoff.setDate(cutoff.getDate() - 30);
  if (mode === "3m")  cutoff.setMonth(cutoff.getMonth() - 3);
  if (mode === "1y")  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return { from: isoDay(cutoff) };
}

const CAT_COLORS: Record<string, string> = {
  "Certification":  "bg-violet-50 text-violet-700",
  "Tax document":   "bg-amber-50  text-amber-700",
  "Policy":         "bg-sky-50    text-sky-700",
  "Agreement":      "bg-emerald-50 text-emerald-700",
  "Insurance":      "bg-orange-50  text-orange-700",
  "Legal document": "bg-red-50     text-red-700",
  "Draft":          "bg-gray-50    text-gray-500",
};

// ─── Shared badge (exported for preview modal) ─────────────────────────────────
export const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const cfg: Record<DocumentStatus, { cls: string; Icon: typeof CheckCircle }> = {
    "Valid":         { cls:"bg-emerald-50 text-emerald-700 border-emerald-200", Icon:CheckCircle },
    "Expiring soon": { cls:"bg-amber-50  text-amber-700  border-amber-200",    Icon:Clock       },
    "Expired":       { cls:"bg-red-50    text-red-700    border-red-200",       Icon:AlertCircle },
    "Under review":  { cls:"bg-sky-50    text-sky-700    border-sky-200",       Icon:FileWarning },
    "Draft":         { cls:"bg-gray-50   text-gray-500   border-gray-200",      Icon:Edit        },
  };
  const { cls, Icon } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{status}
    </span>
  );
};

// ─── Custom radio option ────────────────────────────────────────────────────────
const RadioOption = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50">
    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${checked ? "border-brand-forest bg-brand-forest" : "border-gray-300"}`}>
      {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </div>
    <span className={`text-sm transition-colors ${checked ? "font-medium text-brand-forest" : "text-brand-text"}`}>{label}</span>
  </label>
);

// ─── Group row (first level of filter dropdown) ────────────────────────────────
const GroupRow = ({ label, value, onClick }: { label: string; value: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
  >
    <span className="text-sm font-medium text-brand-text">{label}</span>
    <div className="flex items-center gap-2">
      {value !== "all" && value !== "any" && (
        <span className="max-w-[100px] truncate text-xs text-brand-forest">{value}</span>
      )}
      <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-gray-400" />
    </div>
  </button>
);

// ─── Filter chip ───────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-forest/10 px-3 py-1.5 text-xs font-medium text-brand-forest">
    {label}
    <button onClick={onRemove} className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-brand-forest/20">
      <X className="h-2.5 w-2.5" />
    </button>
  </span>
);

// ─── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, subTone = "text-brand-muted", icon: Icon, iconStyle }: {
  label: string; value: string; sub: string; subTone?: string; icon: typeof FileText; iconStyle: string;
}) => (
  <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconStyle}`}>
      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
    </div>
    <div>
      <p className="m-0 text-[11.5px] uppercase tracking-[0.06em] text-gray-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="m-0 text-3xl font-semibold leading-none tracking-tight text-brand-text">{value}</p>
        <p className={`m-0 text-xs font-semibold ${subTone}`}>{sub}</p>
      </div>
    </div>
  </article>
);

// ─── Person avatar (initials) ───────────────────────────────────────────────────
const initialsOf = (name: string) => name.split(" ").map(word => word[0]).slice(0, 2).join("");

const isInvoiceDocument = (doc: Pick<VendorDocument, "category" | "documentType">) =>
  (doc.documentType ?? doc.category).trim().toUpperCase() === "INVOICE";

/** One mapping from the API shape to the row shape, shared by the initial
 * load and the post-upload insert. They drifted apart before — the upload
 * path invented a vendor the list path left blank — and every filter that
 * reads a field is only as correct as the less careful of the two. */
function toVendorDocument(item: ApiDocument): VendorDocument {
  return {
    id: item.id,
    name: item.filename,
    vendorId: item.vendor_id ?? "",
    category: item.document_type,
    documentType: item.document_type,
    uploadedOn: item.created_at.slice(0, 10),
    expiresOn: item.expires_on ?? null,
    status: toDocumentUiStatus(item.status),
    rawStatus: item.status,
    size: formatBytes(item.size_bytes),
    lastModified: item.created_at,
    uploadedBy: "You",
    extractedFields: item.extracted_fields as ExtractedInvoiceFields | undefined,
  };
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function DocumentsPage() {
  const { vendors } = useVendors();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<VendorDocument[]>([]);

  useEffect(() => {
    void listDocuments()
      .then(items => setDocuments(items.map(toVendorDocument)))
      .catch(console.error);
  }, []);

  const [query,           setQuery]           = useState("");
  const [sortBy,          setSortBy]          = useState<"latest"|"oldest"|"name">("latest");
  const [filterType,      setFilterType]      = useState("all");
  const [filterTag,       setFilterTag]       = useState("all");
  const [filterDate,      setFilterDate]      = useState("any");
  const [filterVendor,    setFilterVendor]    = useState("all");
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");
  const [vendorQuery,     setVendorQuery]     = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeGroup,     setActiveGroup]     = useState<"type"|"tag"|"date"|"vendor"|null>(null);
  const [showSortMenu,    setShowSortMenu]    = useState(false);
  const [previewDoc,      setPreviewDoc]      = useState<VendorDocument | null>(null);
  const [showUpload,      setShowUpload]      = useState(false);
  // Progress of the *currently previewed* document's hydration, tagged with
  // the id it describes. Tagging rather than resetting is what keeps this out
  // of the effect body: opening a different document changes `previewDoc.id`,
  // which stops matching, which is the reset — no synchronous setState, and
  // no window in which a stale verdict is shown against a new document.
  const [extractionUi, setExtractionUi] = useState<{ id: string | null; loaded: boolean; timedOut: boolean }>(
    { id: null, loaded: false, timedOut: false },
  );
  // The list endpoint omits extracted_fields, so a row taken straight from it
  // has no fields for a reason that has nothing to do with extraction. Until
  // the first full fetch lands, the preview must not read "nothing was found".
  const detailsLoaded      = extractionUi.id === previewDoc?.id && extractionUi.loaded;
  const extractionTimedOut = extractionUi.id === previewDoc?.id && extractionUi.timedOut;

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) { setShowFilterPanel(false); setActiveGroup(null); }
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setShowSortMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const applyDocumentUpdate = (id: string, fields: ExtractedInvoiceFields | undefined, status: string) => {
    const patch = { extractedFields: fields, status: toDocumentUiStatus(status), rawStatus: status };
    setPreviewDoc(current => (current && current.id === id ? { ...current, ...patch } : current));
    setDocuments(current => current.map(doc => (doc.id === id ? { ...doc, ...patch } : doc)));
  };

  // How long the preview keeps waiting on an extraction before it says so.
  // The pipeline targets well under this; the point of the ceiling is that a
  // worker that died leaves a spinner that ends, not one that runs forever.
  const EXTRACTION_TIMEOUT_MS = 45_000;

  // The list endpoint returns a lean projection without extracted_fields (see
  // DocumentListItem on the backend), and invoice parsing runs in the
  // background after upload. So fetch the full document when a preview opens,
  // and keep polling while the server still reports work in flight.
  useEffect(() => {
    const id = previewDoc?.id;
    if (!id) return;
    const awaitingParse = previewDoc ? isInvoiceDocument(previewDoc) : false;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const hydrate = () => {
      void getDocument(id).then(fresh => {
        if (cancelled) return;
        const fields = fresh.extracted_fields as ExtractedInvoiceFields | undefined;
        applyDocumentUpdate(id, fields, fresh.status);
        setExtractionUi({ id, loaded: true, timedOut: false });
        // Stop on any settled state, not just "fields arrived". A parse that
        // finished empty or failed writes no fields, and treating that as
        // "still working" is what left the spinner running indefinitely.
        if (!awaitingParse || extractionState(fresh.status, fields) !== "extracting") return;
        if (Date.now() - startedAt >= EXTRACTION_TIMEOUT_MS) {
          setExtractionUi({ id, loaded: true, timedOut: true });
          return;
        }
        // Fast at first — most documents finish in the first couple of polls
        // — then back off so a slow scan doesn't hammer the endpoint.
        const elapsed = Date.now() - startedAt;
        timer = setTimeout(hydrate, elapsed < 10_000 ? 800 : 2_500);
      }).catch(() => {});
    };
    hydrate();

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [previewDoc?.id]);

  /** Follow one freshly-uploaded document until the server stops reporting
   * work in flight, patching the row each time. Bounded: a worker that never
   * finishes leaves the row at whatever it last reported rather than an
   * endless request loop nobody is watching. */
  const trackUpload = async (id: string) => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1_500));
      const fresh = await getDocument(id).catch(() => null);
      if (!fresh) return;
      const fields = fresh.extracted_fields as ExtractedInvoiceFields | undefined;
      setDocuments(current => current.map(doc =>
        doc.id === id ? { ...doc, status: toDocumentUiStatus(fresh.status), rawStatus: fresh.status, extractedFields: fields } : doc,
      ));
      if (extractionState(fresh.status, fields) !== "extracting") return;
    }
  };

  /** Fetch the stored file and hand it to the browser under its original
   * name. The download endpoint is authenticated, so a plain link to it
   * would 401 — the bytes have to come through the API client. */
  const saveDocument = async (doc: VendorDocument) => {
    const blob = await downloadDocument(doc.id).catch(() => null);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = doc.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const vendorById   = useMemo(() => new Map(vendors.map(v => [v.id, v])), [vendors]);
  const allCategories = useMemo(() => [...new Set(documents.map(d => d.category))], [documents]);
  const allTags       = useMemo(() => [...new Set(documents.flatMap(d => d.tags ?? []))], [documents]);

  // ── Overview stats (derived straight from the document list) ──
  const stats = useMemo(() => {
    const now = new Date();
    const dayDiff = (iso: string) => (new Date(`${iso}T00:00:00`).getTime() - now.getTime()) / 86_400_000;

    const totalFiles     = documents.length;
    const newThisWeek    = documents.filter(d => -dayDiff(d.uploadedOn) <= 7 && -dayDiff(d.uploadedOn) >= 0).length;
    const pendingReview  = documents.filter(d => d.status === "Under review").length;
    const expiringSoon   = documents.filter(d => d.expiresOn != null && dayDiff(d.expiresOn) >= 0 && dayDiff(d.expiresOn) <= 30).length;
    const validCount     = documents.filter(d => d.status === "Valid").length;
    const complianceScore = totalFiles > 0 ? Math.round((validCount / totalFiles) * 100) : 100;

    return { totalFiles, newThisWeek, pendingReview, expiringSoon, complianceScore };
  }, [documents]);

  const window_ = useMemo(() => dateWindow(filterDate, dateFrom, dateTo), [filterDate, dateFrom, dateTo]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...documents]
      .filter(doc => {
        if (filterType !== "all" && doc.category !== filterType) return false;
        if (filterTag  !== "all" && !(doc.tags ?? []).includes(filterTag)) return false;
        if (filterVendor === UNASSIGNED_VENDOR) { if (doc.vendorId) return false; }
        else if (filterVendor !== "all" && doc.vendorId !== filterVendor) return false;
        // Both ends inclusive, compared as yyyy-mm-dd strings — the format
        // sorts lexicographically, so this needs no Date parsing and no
        // timezone to get wrong.
        if (window_.from && doc.uploadedOn < window_.from) return false;
        if (window_.to   && doc.uploadedOn > window_.to)   return false;
        if (q) {
          const vendorName = vendorById.get(doc.vendorId)?.name?.toLowerCase() ?? "";
          const haystack = [doc.name, doc.category, doc.uploadedBy ?? "", vendorName, ...(doc.tags ?? [])].join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") return a.uploadedOn.localeCompare(b.uploadedOn);
        if (sortBy === "name")   return a.name.localeCompare(b.name);
        return b.uploadedOn.localeCompare(a.uploadedOn);
      });
  }, [documents, query, filterType, filterTag, filterVendor, window_, sortBy, vendorById]);

  // Only vendors that actually own a document are offered: a filter listing
  // every vendor in the org is mostly rows that select nothing.
  const vendorFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents) counts.set(doc.vendorId || UNASSIGNED_VENDOR, (counts.get(doc.vendorId || UNASSIGNED_VENDOR) ?? 0) + 1);
    const entries = [...counts.entries()]
      .filter(([id]) => id !== UNASSIGNED_VENDOR)
      .map(([id, count]) => ({ id, name: vendorById.get(id)?.name ?? "Unknown vendor", count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const unassigned = counts.get(UNASSIGNED_VENDOR) ?? 0;
    return { entries, unassigned };
  }, [documents, vendorById]);

  const vendorLabel = (id: string) =>
    id === UNASSIGNED_VENDOR ? "Unassigned" : vendorById.get(id)?.name ?? "Unknown vendor";

  const dateLabel = filterDate === "custom"
    ? (window_.from || window_.to
        ? `${window_.from ? formatDate(window_.from) : "Any"} – ${window_.to ? formatDate(window_.to) : "Today"}`
        : "Custom range")
    : DATE_OPTS.find(o => o.value === filterDate)?.label ?? "Any time";

  const recentDocs    = useMemo(() => [...rows].sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn)).slice(0, 3), [rows]);
  const dateFilterOn  = filterDate !== "any" && (filterDate !== "custom" || Boolean(dateFrom || dateTo));
  const filtersActive = filterType !== "all" || filterTag !== "all" || filterVendor !== "all" || dateFilterOn;
  const activeCount   = [filterType !== "all", filterTag !== "all", filterVendor !== "all", dateFilterOn].filter(Boolean).length;
  const clearDate     = () => { setFilterDate("any"); setDateFrom(""); setDateTo(""); };
  const clearAll      = () => { setFilterType("all"); setFilterTag("all"); setFilterVendor("all"); clearDate(); };

  return (
    <div className="space-y-9 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-6 pt-1">
        <div className="max-w-xl">
          <h1 className="m-0 font-serif text-4xl font-normal tracking-tight text-brand-forest">Documents</h1>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-brand-muted">
            Every certificate, policy and agreement across your vendor network — versioned and audit-ready.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-forest px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-forest-light hover:shadow-md"
        >
          <Plus className="h-4 w-4" />New document
        </button>
      </div>

      {/* ── Stats ──
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total files"
          value={String(stats.totalFiles)}
          sub={stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : "Up to date"}
          subTone="text-brand-forest"
          icon={FileText}
          iconStyle="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="Pending review"
          value={String(stats.pendingReview)}
          sub={stats.pendingReview > 0 ? "Needs attention" : "All caught up"}
          subTone={stats.pendingReview > 0 ? "text-brand-gold-dark" : "text-brand-muted"}
          icon={FileWarning}
          iconStyle="bg-amber-50 text-brand-gold-dark"
        />
        <StatCard
          label="Expiring in 30 days"
          value={String(stats.expiringSoon)}
          sub={stats.expiringSoon > 0 ? "Action needed" : "Nothing upcoming"}
          subTone={stats.expiringSoon > 0 ? "text-red-600" : "text-brand-muted"}
          icon={Clock}
          iconStyle="bg-red-50 text-red-600"
        />
        <article className="flex flex-col gap-4 rounded-2xl bg-brand-forest p-5 text-white shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="m-0 text-[11.5px] uppercase tracking-[0.06em] text-white/60">Compliance score</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="m-0 text-3xl font-semibold leading-none tracking-tight text-emerald-300">{stats.complianceScore}%</p>
              <p className="m-0 text-xs font-semibold text-white/60">{stats.complianceScore >= 80 ? "Above target" : "Needs attention"}</p>
            </div>
          </div>
        </article>
      </section> */}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents, vendors, tags…"
            className="h-9 w-full rounded-xl bg-gray-50 pl-9 pr-3 text-sm text-brand-text ring-1 ring-gray-200 transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-brand-forest/40"
          />
        </div>

        {/* Filters */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => {
              setShowFilterPanel(p => !p);
              setActiveGroup(null);
              setShowSortMenu(false);
            }}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-colors ${
              showFilterPanel || filtersActive
                ? "bg-brand-forest/10 text-brand-forest"
                : "text-brand-muted hover:bg-gray-100 hover:text-brand-text"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filtersActive && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-forest text-[9px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>

          {showFilterPanel && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.07]">

              {/* Level 1 — group list */}
              {!activeGroup && (
                <div className="px-1 py-2">
                  <GroupRow
                    label="Type"
                    value={filterType}
                    onClick={() => setActiveGroup("type")}
                  />
                  <GroupRow
                    label="Tag"
                    value={filterTag}
                    onClick={() => setActiveGroup("tag")}
                  />
                  <GroupRow
                    label="Vendor"
                    value={filterVendor === "all" ? "all" : vendorLabel(filterVendor)}
                    onClick={() => { setActiveGroup("vendor"); setVendorQuery(""); }}
                  />
                  <GroupRow
                    label="Date"
                    value={dateFilterOn ? dateLabel : "all"}
                    onClick={() => setActiveGroup("date")}
                  />
                  {filtersActive && (
                    <button
                      onClick={() => { clearAll(); setShowFilterPanel(false); }}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Level 2 — Type options */}
              {activeGroup === "type" && (
                <div className="px-1 py-2">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className="mb-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50"
                  >
                    <ChevronDown className="h-3 w-3 rotate-90" />
                    Type
                  </button>
                  <RadioOption checked={filterType === "all"} onChange={() => setFilterType("all")} label="All types" />
                  {allCategories.map(cat => (
                    <RadioOption key={cat} checked={filterType === cat} onChange={() => { setFilterType(cat); setActiveGroup(null); }} label={cat} />
                  ))}
                </div>
              )}

              {/* Level 2 — Tag options */}
              {activeGroup === "tag" && (
                <div className="px-1 py-2">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className="mb-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50"
                  >
                    <ChevronDown className="h-3 w-3 rotate-90" />
                    Tag
                  </button>
                  <RadioOption checked={filterTag === "all"} onChange={() => setFilterTag("all")} label="All tags" />
                  {allTags.map(tag => (
                    <RadioOption key={tag} checked={filterTag === tag} onChange={() => { setFilterTag(tag); setActiveGroup(null); }} label={tag} />
                  ))}
                </div>
              )}

              {/* Level 2 — Vendor options */}
              {activeGroup === "vendor" && (
                <div className="px-1 py-2">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className="mb-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50"
                  >
                    <ChevronDown className="h-3 w-3 rotate-90" />
                    Vendor
                  </button>
                  {vendorFacets.entries.length > 6 && (
                    <div className="mx-2 mb-1 flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-200">
                      <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <input
                        autoFocus
                        value={vendorQuery}
                        onChange={e => setVendorQuery(e.target.value)}
                        placeholder="Search vendors…"
                        className="w-full border-0 bg-transparent text-sm text-brand-text outline-none placeholder:text-gray-400"
                      />
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto">
                    <RadioOption checked={filterVendor === "all"} onChange={() => { setFilterVendor("all"); setActiveGroup(null); }} label="All vendors" />
                    {vendorFacets.entries
                      .filter(entry => entry.name.toLowerCase().includes(vendorQuery.trim().toLowerCase()))
                      .map(entry => (
                        <RadioOption
                          key={entry.id}
                          checked={filterVendor === entry.id}
                          onChange={() => { setFilterVendor(entry.id); setActiveGroup(null); }}
                          label={`${entry.name} (${entry.count})`}
                        />
                      ))}
                    {vendorFacets.unassigned > 0 && (
                      <RadioOption
                        checked={filterVendor === UNASSIGNED_VENDOR}
                        onChange={() => { setFilterVendor(UNASSIGNED_VENDOR); setActiveGroup(null); }}
                        label={`Unassigned (${vendorFacets.unassigned})`}
                      />
                    )}
                    {vendorFacets.entries.length === 0 && vendorFacets.unassigned === 0 && (
                      <p className="px-3 py-2 text-sm text-brand-muted">No documents are filed against a vendor yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Level 2 — Date options */}
              {activeGroup === "date" && (
                <div className="px-1 py-2">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className="mb-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-50"
                  >
                    <ChevronDown className="h-3 w-3 rotate-90" />
                    Date
                  </button>
                  {DATE_OPTS.map(opt => (
                    <RadioOption
                      key={opt.value}
                      checked={filterDate === opt.value}
                      // A custom range keeps the panel open: picking it is the
                      // start of choosing a range, not the end of it.
                      onChange={() => { setFilterDate(opt.value); if (opt.value !== "custom") setActiveGroup(null); }}
                      label={opt.label}
                    />
                  ))}
                  {filterDate === "custom" && (
                    <div className="animate-rise-in mx-2 mb-1 mt-1 space-y-2 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
                      <label className="block">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">From</span>
                        <input
                          type="date"
                          value={dateFrom}
                          max={dateTo || undefined}
                          onChange={e => setDateFrom(e.target.value)}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-brand-text outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">To</span>
                        <input
                          type="date"
                          value={dateTo}
                          min={dateFrom || undefined}
                          onChange={e => setDateTo(e.target.value)}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-brand-text outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
                        />
                      </label>
                      <div className="flex items-center justify-between pt-0.5">
                        <button
                          onClick={() => { setDateFrom(""); setDateTo(""); }}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-brand-muted transition-colors hover:bg-white hover:text-brand-text"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setActiveGroup(null)}
                          className="rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-forest-light"
                        >
                          Apply
                        </button>
                      </div>
                      {/* Either end may be left open; only a backwards range
                          is actually wrong, and saying so beats silently
                          returning nothing. */}
                      {dateFrom && dateTo && dateFrom > dateTo && (
                        <p className="mb-0 text-xs text-red-600">The start date is after the end date.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sort by */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => { setShowSortMenu(p => !p); setShowFilterPanel(false); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium text-brand-muted transition-colors hover:bg-gray-100 hover:text-brand-text"
          >
            Sort By: {SORT_OPTS.find(o => o.value === sortBy)?.label}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`} />
          </button>

          {showSortMenu && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-44 overflow-hidden rounded-2xl bg-white py-1.5 shadow-2xl ring-1 ring-black/[0.07]">
              {SORT_OPTS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value as typeof sortBy); setShowSortMenu(false); }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sortBy === opt.value ? "font-semibold text-brand-forest" : "text-brand-text"}`}
                >
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full transition-opacity ${sortBy === opt.value ? "bg-brand-forest opacity-100" : "opacity-0"}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active chips */}
        {filterType   !== "all" && <Chip label={`Type: ${filterType}`}                  onRemove={() => setFilterType("all")}   />}
        {filterTag    !== "all" && <Chip label={`Tag: ${filterTag}`}                    onRemove={() => setFilterTag("all")}    />}
        {filterVendor !== "all" && <Chip label={`Vendor: ${vendorLabel(filterVendor)}`} onRemove={() => setFilterVendor("all")} />}
        {dateFilterOn           && <Chip label={dateLabel}                              onRemove={clearDate}                    />}
      </div>

      {/* ── Folders ── */}
      <section>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Folders</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {folderGroups.map(folder => {
            const count = rows.filter(d => folder.categories.includes(d.category)).length;
            return (
              <article
                key={folder.name}
                className="flex cursor-pointer flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-background">
                  <Folder className="h-5 w-5 text-brand-forest" />
                </div>
                <div>
                  <p className="m-0 text-sm font-bold text-brand-text">{folder.name}</p>
                  <p className="mb-0 mt-0.5 text-xs text-brand-muted">
                    {count} {count === 1 ? "File" : "Files"}{count > 0 && <> · {folder.size}</>}
                    {count === 0 && <span className="ml-1 text-amber-500">No matching files</span>}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Recent ── */}
      <section>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Recent</p>
        {recentDocs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-medium text-brand-text">{doc.name}</p>
                  <p className="mb-0 mt-0.5 text-xs text-brand-muted">{formatDate(doc.uploadedOn)} · {doc.size}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-muted">No recent files match the current filters.</p>
        )}
      </section>

      {/* ── All Files ── */}
      <section>
        <div className="mb-4 flex items-baseline gap-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">All Files</p>
          <span className="text-xs font-semibold text-brand-muted">{rows.length} of {documents.length}</span>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-brand-border bg-gray-50/80">
                    {["Name","Type","Vendor","Tags","Size","Modified","Owner"].map(h => (
                      <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(doc => (
                    <tr
                      key={doc.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50/70"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                          <span className="text-sm font-semibold text-brand-text">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CAT_COLORS[doc.category] ?? "bg-gray-50 text-gray-500"}`}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {doc.vendorId
                          ? <span className="text-brand-text">{vendorById.get(doc.vendorId)?.name ?? "Unknown vendor"}</span>
                          : <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(doc.tags ?? []).slice(0, 2).map(tag => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted">{doc.size}</td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted">{formatDate(doc.lastModified.slice(0, 10))}</td>
                      <td className="px-5 py-3.5">
                        {doc.uploadedBy ? (
                          <div className="flex items-center gap-2">
                            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-background text-[10px] font-semibold text-brand-forest">
                              {initialsOf(doc.uploadedBy)}
                            </div>
                            <span className="truncate text-sm text-brand-text">{doc.uploadedBy}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-brand-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <p className="m-0 text-sm font-medium text-brand-text">No documents found</p>
              <button onClick={() => { clearAll(); setQuery(""); }} className="mt-2 text-sm text-brand-forest hover:underline">Clear filters</button>
            </div>
          )}
          {rows.length > 0 && (
            <p className="px-5 py-3 text-xs text-gray-400">Showing {rows.length} of {documents.length} documents</p>
          )}
        </div>
      </section>

      {/* Modals */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          vendor={vendorById.get(previewDoc.vendorId)}
          onClose={() => setPreviewDoc(null)}
          extractionTimedOut={extractionTimedOut}
          detailsLoaded={detailsLoaded}
          onDownload={() => void saveDocument(previewDoc)}
          onDelete={async id => { await deleteDocument(id); setDocuments(current => current.filter(document => document.id !== id)); setPreviewDoc(null); }}
          onToggleStar={id => console.log("star", id)}
          onFieldsSaved={fields => applyDocumentUpdate(previewDoc.id, fields, "CONFIRMED")}
          onReviewInvoice={isInvoiceDocument(previewDoc) ? () => {
            const fields = previewDoc.extractedFields ?? {};
            setPreviewDoc(null);
            navigate("/invoices/add", {
              state: {
                documentId: previewDoc.id,
                invoice_number: fields.invoice_number ?? undefined,
                invoice_date: fields.invoice_date ?? undefined,
                due_date: fields.due_date ?? undefined,
                amount: fields.subtotal ?? undefined,
                tax_amount: fields.tax_amount ?? undefined,
                vendor_gstin: fields.vendor_gstin ?? undefined,
                vendor_name: fields.vendor_name ?? undefined,
                warnings: fields.warnings ?? [],
                validation_errors: fields.validation_errors ?? [],
                parsing_confidence: fields.parsing_confidence ?? undefined,
                line_items: fields.line_items ?? [],
              },
            });
          } : undefined}
        />
      )}
      {showUpload && (
        <UploadDocumentModal
          vendors={vendors}
          onClose={() => setShowUpload(false)}
          onCreateVendor={() => { setShowUpload(false); navigate("/vendors/add?returnTo=/documents"); }}
          onUpload={async (payload: UploadPayload) => {
            const created = await Promise.all(payload.files.map(file =>
              uploadDocument(file, payload.category, {
                vendorId: payload.vendorId,
                expiresOn: payload.expiresOn,
                onProgress: percent => payload.onFileProgress?.(file, percent),
              }),
            ));
            const mapped = created.map(toVendorDocument);
            setDocuments(current => [...mapped, ...current]);
            // The modal closes itself once its success animation has played.

            // Invoice parsing runs in the background (same dispatch as the
            // rest of the document pipeline), so the status/extracted_fields
            // above reflect "just uploaded", not the finished parse. Poll
            // until each one settles so the row updates itself to its real
            // status and extracted data without a manual refresh.
            const invoiceUploads = mapped.filter(isInvoiceDocument);
            for (const doc of invoiceUploads) void trackUpload(doc.id);
          }}
        />
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    .format(new Date(`${value}T00:00:00`));
}
