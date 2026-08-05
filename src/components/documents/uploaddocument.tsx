// uploaddocument.tsx
import { useRef, useState, type DragEvent } from "react";
import { X, UploadCloud, File as FileIcon, Trash2, Loader2, CheckCircle2 } from "lucide-react";

type VendorOption = { id: string; name: string };
type PendingFile  = { id: string; file: File };
export type UploadPayload = { files: File[]; vendorId: string; category: string; expiresOn: string };

type Props = {
  vendors: VendorOption[];
  categories?: string[];
  onClose: () => void;
  onUpload: (payload: UploadPayload) => Promise<void>;
};

const DEFAULT_CATEGORIES = ["Certification","Legal document","Tax document","Insurance","Agreement","Policy"];

export function UploadDocumentModal({ vendors, categories = DEFAULT_CATEGORIES, onClose, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending,      setPending]      = useState<PendingFile[]>([]);
  const [isDragging,   setIsDragging]   = useState(false);
  const [vendorId,     setVendorId]     = useState(vendors[0]?.id ?? "");
  const [category,     setCategory]     = useState(categories[0] ?? "");
  const [expiresOn,    setExpiresOn]    = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      file,
    }));
    setPending(p => [...p, ...next]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files);
  };

  const canSubmit = pending.length > 0 && Boolean(vendorId) && Boolean(category) && !isSubmitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/[0.07]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 id="upload-title" className="m-0 text-base font-semibold text-brand-text">Upload document</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 pb-6" style={{ maxHeight: "72vh" }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center transition-all ${
              isDragging
                ? "bg-brand-forest/5 ring-2 ring-brand-forest/30"
                : "bg-gray-50 ring-1 ring-gray-200/80 hover:bg-gray-100/70"
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-colors ${isDragging ? "bg-brand-forest/10 text-brand-forest" : "bg-white text-brand-gold-dark"}`}>
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="m-0 text-sm font-medium text-brand-text">Drag and drop files here, or click to browse</p>
              <p className="mb-0 mt-1 text-xs text-brand-muted">PDF, DOCX, XLSX, PNG — up to 25 MB per file</p>
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-gold-dark shadow-sm ring-1 ring-black/[0.04]">
                    <FileIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-medium text-brand-text">{entry.file.name}</p>
                    <p className="mb-0 mt-0.5 text-xs text-brand-muted">{formatBytes(entry.file.size)}</p>
                  </div>
                  <button
                    onClick={() => setPending(p => p.filter(f => f.id !== entry.id))}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="upl-vendor" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">Vendor</label>
              <select
                id="upl-vendor"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="h-10 w-full rounded-xl bg-gray-50 px-3 text-sm text-brand-text outline-none ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-brand-forest/40"
              >
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="upl-cat" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">Category</label>
              <select
                id="upl-cat"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl bg-gray-50 px-3 text-sm text-brand-text outline-none ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-brand-forest/40"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="upl-expiry" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Expiry date <span className="normal-case font-normal text-gray-300">(optional)</span>
              </label>
              <input
                id="upl-expiry"
                type="date"
                value={expiresOn}
                onChange={e => setExpiresOn(e.target.value)}
                className="h-10 w-full rounded-xl bg-gray-50 px-3 text-sm text-brand-text outline-none ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-brand-forest/40"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-brand-muted transition-colors hover:bg-gray-50 hover:text-brand-text"
          >
            Cancel
          </button>
          <button
            onClick={async () => { if (!canSubmit) return; setIsSubmitting(true); try { await onUpload({ files: pending.map(e => e.file), vendorId, category, expiresOn }); } finally { setIsSubmitting(false); } }}
            disabled={!canSubmit}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-forest px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-forest-light hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
              : <><CheckCircle2 className="h-4 w-4" />Upload{pending.length > 0 ? ` (${pending.length})` : ""}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const u = ["B","KB","MB","GB"];
  const e = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), u.length - 1);
  const v = bytes / Math.pow(1024, e);
  return `${v.toFixed(v >= 10 || e === 0 ? 0 : 1)} ${u[e]}`;
}
