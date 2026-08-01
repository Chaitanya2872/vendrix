// document_preview.tsx
import { useEffect } from "react";
import { X, Download, Share2, Trash2, Star, StarOff, FileText, Building2, HardDrive, Calendar, Clock } from "lucide-react";
import { StatusBadge, type VendorDocument } from "../../pages/Documents/DocumentsPage";

type DocumentPreviewProps = {
  document: VendorDocument;
  vendor?: { name?: string; code?: string };
  onClose: () => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
};

export function DocumentPreview({ document, vendor, onClose, onDownload, onDelete, onToggleStar }: DocumentPreviewProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/[0.07]"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-brand-gold-dark">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="doc-preview-title" className="m-0 truncate text-base font-semibold text-brand-text">
              {document.name}
            </h2>
            <p className="mb-0 mt-0.5 text-xs text-brand-muted">{document.category}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => onToggleStar?.(document.id)}
              className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50"
              aria-label={document.starred ? "Remove star" : "Add star"}
            >
              {document.starred
                ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                : <StarOff className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="mx-6 flex flex-col items-center gap-2 rounded-2xl bg-gray-50/70 px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-gold-dark shadow-sm ring-1 ring-black/[0.04]">
            <FileText className="h-7 w-7" />
          </div>
          <p className="m-0 text-sm text-brand-muted">Preview not available for this file type</p>
          <p className="m-0 text-xs text-gray-400">Download the file to view its contents</p>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <InfoRow icon={Building2} label="Vendor"    value={vendor?.name ?? "Unknown"} />
            <InfoRow icon={HardDrive} label="File size" value={document.size} />
            <InfoRow icon={Calendar}  label="Uploaded"  value={formatDate(document.uploadedOn)} />
            <InfoRow icon={Clock}     label="Expires"   value={document.expiresOn ? formatDate(document.expiresOn) : "No expiry"} />
            <div className="col-span-2 flex flex-wrap gap-6">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">Status</p>
                <StatusBadge status={document.status} />
              </div>
              {document.tags && document.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <button
            onClick={() => onDelete?.(document.id)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />Delete
          </button>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-medium text-brand-text transition-colors hover:bg-gray-200">
              <Share2 className="h-4 w-4" />Share
            </button>
            <button
              onClick={() => onDownload?.(document.id)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-forest px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-forest-light hover:shadow-md"
            >
              <Download className="h-4 w-4" />Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div>
    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
      <span className="text-sm text-brand-text">{value}</span>
    </div>
  </div>
);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    .format(new Date(`${value}T00:00:00`));
}