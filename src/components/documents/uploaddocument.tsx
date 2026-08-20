// uploaddocument.tsx
import { useRef, useState, type DragEvent } from "react";
import { X, UploadCloud, File as FileIcon, Trash2, Loader2, CheckCircle2, TriangleAlert, Plus } from "lucide-react";
import { AnimatedCheck } from "../ui/AnimatedCheck";

type VendorOption = { id: string; name: string };
type PendingFile  = { id: string; file: File };
export type UploadPayload = {
  files: File[];
  vendorId: string;
  category: string;
  expiresOn: string;
  /** Lets the page stream real per-file upload progress back into this
   * modal's progress bars while it drives the requests. */
  onFileProgress?: (file: File, percent: number) => void;
};

type Props = {
  vendors: VendorOption[];
  categories?: string[];
  onClose: () => void;
  onUpload: (payload: UploadPayload) => Promise<void>;
  /** Leaves this dialog for the vendor form. Owned by the page because
   * navigating unmounts the dialog, so it has to be the page's decision
   * what happens to the files staged here. */
  onCreateVendor?: () => void;
};

const DEFAULT_CATEGORIES = ["Invoice","Certification","Legal document","Tax document","Insurance","Agreement","Policy"];

/** idle → sending (bars fill) → done (tick draws, modal closes itself). */
type Phase = "idle" | "sending" | "done" | "error";

export function UploadDocumentModal({ vendors, categories = DEFAULT_CATEGORIES, onClose, onUpload, onCreateVendor }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending,      setPending]      = useState<PendingFile[]>([]);
  const [isDragging,   setIsDragging]   = useState(false);
  const [vendorId,     setVendorId]     = useState("");
  const [category,     setCategory]     = useState(categories[0] ?? "");
  const [expiresOn,    setExpiresOn]    = useState("");
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [progress,     setProgress]     = useState<Record<string, number>>({});
  const isSubmitting = phase === "sending";

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

  // Vendor is deliberately not required. A document filed against no vendor
  // is recoverable — it shows as "Unassigned" and can be reassigned — while a
  // blocked upload just loses the file the user was holding.
  const canSubmit = pending.length > 0 && Boolean(category) && (phase === "idle" || phase === "error");

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("sending");
    setProgress(Object.fromEntries(pending.map(entry => [entry.id, 0])));
    try {
      await onUpload({
        files: pending.map(entry => entry.file),
        vendorId,
        category,
        expiresOn,
        onFileProgress: (file, percent) => {
          const entry = pending.find(candidate => candidate.file === file);
          if (entry) setProgress(current => ({ ...current, [entry.id]: percent }));
        },
      });
      setProgress(Object.fromEntries(pending.map(entry => [entry.id, 100])));
      setPhase("done");
      // Hold the finished state briefly so the tick actually plays, then
      // dismiss. The page no longer closes this dialog itself.
      setTimeout(onClose, 1100);
    } catch {
      setPhase("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4 backdrop-blur-[2px]"
      onClick={() => { if (phase !== "sending" && phase !== "done") onClose(); }}
    >
      <div
        className={`animate-pop-in flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 transition-shadow ${phase === "done" ? "animate-success-ring ring-brand-forest/30" : "ring-black/[0.07]"}`}
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
            onDragOver={e => { e.preventDefault(); if (!isSubmitting) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => { if (!isSubmitting) inputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !isSubmitting) inputRef.current?.click(); }}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center transition-all duration-300 ${
              isSubmitting || phase === "done"
                ? "pointer-events-none scale-[0.98] opacity-50"
                : isDragging
                  ? "scale-[1.01] cursor-pointer bg-brand-forest/5 ring-2 ring-brand-forest/30"
                  : "cursor-pointer bg-gray-50 ring-1 ring-gray-200/80 hover:bg-gray-100/70"
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 ${isDragging ? "animate-float bg-brand-forest/10 text-brand-forest" : "bg-white text-brand-gold-dark"}`}>
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
              {pending.map((entry, index) => {
                const percent = progress[entry.id] ?? 0;
                const complete = phase === "done" || percent >= 100;
                return (
                  <div
                    key={entry.id}
                    className="animate-rise-in flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 transition-colors ${complete && phase !== "idle" ? "text-brand-forest ring-brand-forest/20" : "text-brand-gold-dark ring-black/[0.04]"}`}>
                      {phase !== "idle" && complete
                        ? <AnimatedCheck className="h-4 w-4" />
                        : <FileIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-medium text-brand-text">{entry.file.name}</p>
                      {phase === "idle" || phase === "error" ? (
                        <p className="mb-0 mt-0.5 text-xs text-brand-muted">{formatBytes(entry.file.size)}</p>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Uploading ${entry.file.name}`}
                          >
                            <div
                              className={`h-full rounded-full transition-[width] duration-300 ease-out ${complete ? "bg-brand-forest" : "progress-stripe animate-bar-stripe bg-brand-gold-dark"}`}
                              style={{ width: `${Math.max(percent, 4)}%` }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-brand-muted">
                            {complete ? "Done" : `${percent}%`}
                          </span>
                        </div>
                      )}
                    </div>
                    {(phase === "idle" || phase === "error") && (
                      <button
                        onClick={() => setPending(p => p.filter(f => f.id !== entry.id))}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                        aria-label={`Remove ${entry.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="upl-vendor" className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Vendor <span className="font-normal normal-case text-gray-300">(optional)</span>
              </label>
              <select
                id="upl-vendor"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="h-10 w-full rounded-xl bg-gray-50 px-3 text-sm text-brand-text outline-none ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-brand-forest/40"
              >
                <option value="">{vendors.length ? "No vendor" : "No vendors yet"}</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {onCreateVendor && (
                <p className="mb-0 mt-1.5 flex items-center gap-1 text-xs text-brand-muted">
                  <Plus className="h-3 w-3 shrink-0 text-brand-forest" />
                  {vendors.length ? "Vendor not listed?" : "No vendors yet —"}{" "}
                  <button
                    type="button"
                    onClick={onCreateVendor}
                    disabled={isSubmitting || phase === "done"}
                    className="font-medium text-brand-forest hover:underline disabled:no-underline disabled:opacity-40"
                  >
                    Create one
                  </button>
                </p>
              )}
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
          {phase === "error" && (
            <p className="animate-rise-in mr-auto mb-0 inline-flex items-center gap-1.5 text-xs text-red-600">
              <TriangleAlert className="h-3.5 w-3.5" />Upload failed. Check the connection and try again.
            </p>
          )}
          <button
            onClick={onClose}
            disabled={isSubmitting || phase === "done"}
            className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-brand-muted transition-colors hover:bg-gray-50 hover:text-brand-text disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-live="polite"
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300 disabled:cursor-not-allowed ${
              phase === "done"
                ? "bg-brand-forest"
                : "bg-brand-forest hover:bg-brand-forest-light hover:shadow-md disabled:opacity-50"
            }`}
          >
            {phase === "sending" && <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>}
            {phase === "done"    && <><AnimatedCheck className="h-4 w-4" />Uploaded</>}
            {(phase === "idle" || phase === "error") && (
              <><CheckCircle2 className="h-4 w-4" />{phase === "error" ? "Retry upload" : "Upload"}{pending.length > 0 ? ` (${pending.length})` : ""}</>
            )}
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
