// document_preview.tsx
import { useEffect, useState } from "react";
import { X, Download, Share2, Trash2, Star, StarOff, FileText, Building2, HardDrive, Calendar, Clock } from "lucide-react";
import { StatusBadge, type VendorDocument } from "../../pages/Documents/DocumentsPage";
import { downloadDocument, getDocumentPreview, type DocumentPreviewData } from "@/api/documents";

type DocumentPreviewProps = {
  document: VendorDocument;
  vendor?: { name?: string; code?: string };
  onClose: () => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
};

export function DocumentPreview({ document, vendor, onClose, onDownload, onDelete, onToggleStar }: DocumentPreviewProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [officePreview, setOfficePreview] = useState<DocumentPreviewData | null>(null);
  const extension = document.name.split(".").pop()?.toLowerCase();
  const previewableImage = ["jpg", "jpeg", "png", "webp"].includes(extension ?? "");
  const previewablePdf = extension === "pdf";
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    let url: string | null = null;
    setPreviewError(false); setFileUrl(null); setOfficePreview(null);
    void downloadDocument(document.id).then(blob => { url = URL.createObjectURL(blob); setFileUrl(url); }).catch(() => setPreviewError(true));
    if (!previewableImage && !previewablePdf) void getDocumentPreview(document.id).then(setOfficePreview).catch(() => setPreviewError(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [document.id]);

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
        <div className="mx-6 overflow-hidden rounded-2xl bg-gray-50/70 text-center">
          {!fileUrl && !previewError && <div className="px-6 py-10 text-sm text-brand-muted">Loading preview…</div>}
          {fileUrl && previewableImage && <img src={fileUrl} alt={document.name} className="max-h-[46vh] w-full object-contain" />}
          {fileUrl && previewablePdf && <iframe src={fileUrl} title={document.name} className="h-[46vh] w-full bg-white" />}
          {fileUrl && officePreview?.type === "document" && <div className="max-h-[46vh] overflow-y-auto bg-white px-6 py-5 text-left text-sm leading-7 text-brand-text">{officePreview.lines.length ? officePreview.lines.map((line, index) => <p key={index} className="my-0 border-b border-gray-100 py-1.5 last:border-0">{line}</p>) : <p className="text-brand-muted">This document has no readable text.</p>}</div>}
          {fileUrl && officePreview?.type === "spreadsheet" && <div className="max-h-[46vh] overflow-auto bg-white text-left"><p className="sticky left-0 top-0 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-brand-muted">{officePreview.sheet}</p><table className="min-w-full text-xs"><tbody>{officePreview.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-gray-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-brand-text">{cell}</td>)}</tr>)}</tbody></table></div>}
          {fileUrl && officePreview?.type === "binary" && <div className="px-6 py-10 text-sm text-brand-muted">A preview is not available for this file.</div>}
          {previewError && <div className="px-6 py-10 text-sm text-red-600">Preview could not be loaded. Try downloading the file.</div>}
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
