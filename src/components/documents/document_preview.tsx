// document_preview.tsx
import { useEffect, useState } from "react";
import { X, Download, Share2, Trash2, Star, StarOff, FileText, Building2, HardDrive, Calendar, Clock, ReceiptText, TriangleAlert, Loader2, FileQuestion, RotateCw } from "lucide-react";
import { AnimatedCheck } from "../ui/AnimatedCheck";
import { ExtractionProgress, ScanBeam } from "./ExtractionProgress";
import { StatusBadge, type VendorDocument } from "../../pages/Documents/DocumentsPage";
import { downloadDocument, extractionState, getDocumentPreview, reviewDocument, type DocumentPreviewData, type ExtractedInvoiceFields } from "@/api/documents";

type DocumentPreviewProps = {
  document: VendorDocument;
  vendor?: { name?: string; code?: string };
  onClose: () => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  /** Present only for INVOICE-typed documents; hands the extracted fields
   * off to the invoice form for review/confirmation. */
  onReviewInvoice?: () => void;
  /** Notifies the page that corrected fields were saved, so the documents
   * list and this document's status stay in sync with the server. */
  onFieldsSaved?: (fields: ExtractedInvoiceFields) => void;
  /** The page gave up waiting on this document's extraction. Shown instead
   * of a progress list that would otherwise animate forever. */
  extractionTimedOut?: boolean;
  /** Whether the full document (including extracted_fields) has been fetched.
   * False on open, because the list projection this row came from carries no
   * fields — reporting "nothing was found" before the fetch lands would be a
   * verdict on data nobody has looked at yet. */
  detailsLoaded?: boolean;
};

/** The editable subset of the parsed invoice. `line_items`, confidence and
 * warnings are deliberately excluded: they're parser output about the
 * extraction rather than values a reviewer corrects by hand, and they're
 * preserved untouched when saving. */
const EDITABLE_FIELDS: { key: keyof ExtractedInvoiceFields; label: string; numeric?: boolean }[] = [
  { key: "invoice_number",  label: "Invoice number" },
  { key: "invoice_date",    label: "Invoice date" },
  { key: "due_date",        label: "Due date" },
  { key: "vendor_name",     label: "Vendor" },
  { key: "vendor_gstin",    label: "Vendor GSTIN" },
  { key: "customer_name",   label: "Customer" },
  { key: "customer_gstin",  label: "Customer GSTIN" },
  { key: "subtotal",        label: "Subtotal",     numeric: true },
  { key: "cgst_amount",     label: "CGST",         numeric: true },
  { key: "sgst_amount",     label: "SGST",         numeric: true },
  { key: "igst_amount",     label: "IGST",         numeric: true },
  { key: "tax_amount",      label: "Tax total",    numeric: true },
  { key: "total_amount",    label: "Total amount", numeric: true },
];

export function DocumentPreview({ document, vendor, onClose, onDownload, onDelete, onToggleStar, onReviewInvoice, onFieldsSaved, extractionTimedOut, detailsLoaded = true }: DocumentPreviewProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [officePreview, setOfficePreview] = useState<DocumentPreviewData | null>(null);
  // Draft copy of the extracted values, edited as plain strings so a
  // half-typed number never collapses to NaN mid-keystroke.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // While parsing runs the server publishes progress into the same field the
  // results land in, flagged with in_progress. Ask the shared state machine
  // rather than testing for the payload here: a parse that finished empty or
  // failed writes no fields either, and reading that as "still working" is
  // what used to leave this panel spinning indefinitely.
  const state = extractionState(document.rawStatus ?? "", document.extractedFields);
  // Before the fetch lands, treat the document as still working: it is the
  // one reading that is never wrong to show for a second and never leaves a
  // wrong verdict on screen.
  const extracting = !detailsLoaded || (state === "extracting" && !extractionTimedOut);
  const fields = state === "ready" ? document.extractedFields : undefined;
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

  // Re-seed the draft whenever the parser delivers fields for this document.
  // Parsing finishes in the background, so the fields often arrive while the
  // dialog is already open.
  useEffect(() => {
    if (!fields) { setDraft({}); return; }
    setDraft(Object.fromEntries(
      EDITABLE_FIELDS.map(({ key }) => [key, fields[key] == null ? "" : String(fields[key])]),
    ));
    setSaveState("idle");
  }, [document.id, fields]);

  const handleSave = async () => {
    setSaveState("saving");
    // Keep parser-owned metadata (line items, confidence, warnings) intact and
    // overlay only what the reviewer edited.
    const edited: ExtractedInvoiceFields = { ...document.extractedFields };
    for (const { key, numeric } of EDITABLE_FIELDS) {
      const raw = (draft[key] ?? "").trim();
      (edited[key] as unknown) = raw === "" ? null : numeric ? Number(raw) : raw;
    }
    try {
      const saved = await reviewDocument(document.id, edited);
      setSaveState("saved");
      onFieldsSaved?.((saved.extracted_fields ?? edited) as ExtractedInvoiceFields);
    } catch {
      setSaveState("error");
    }
  };

  const invalidNumbers = EDITABLE_FIELDS.filter(
    ({ key, numeric }) => numeric && (draft[key] ?? "").trim() !== "" && Number.isNaN(Number(draft[key])),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-brand-gold-dark">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="doc-preview-title" className="m-0 truncate text-base font-semibold text-brand-text">
            {document.name}
          </h2>
          <p className="mb-0 mt-0.5 flex items-center gap-2 text-xs text-brand-muted">
            <span className="truncate">{document.category}</span>
            <span className="text-gray-300">·</span>
            <span className="truncate">{vendor?.name ?? "Unassigned"}</span>
          </p>
        </div>
        <div className="hidden shrink-0 md:block">
          <StatusBadge status={document.status} />
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
          <button className="hidden rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50 sm:block" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDownload?.(document.id)}
            className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete?.(document.id)}
            className="rounded-xl p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <button onClick={onClose} className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-gray-50" aria-label="Close">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* ── Body: fields on the left, the file itself on the right ──
          Stacked below lg, where two columns would leave neither one wide
          enough to read. The preview leads in that case: it is the thing
          the reader is checking the fields against. */}
      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">

        {/* Left — details and extracted fields */}
        <section className="flex min-h-0 w-full flex-col overflow-y-auto border-gray-100 lg:w-[46%] lg:max-w-[620px] lg:border-r xl:w-[42%]">
          <div className="space-y-6 px-5 py-5 sm:px-6">

            {/* Extracted invoice data (only for INVOICE-typed documents) */}
            {onReviewInvoice && (
              <div className={`animate-rise-in rounded-2xl border bg-amber-50/40 px-5 py-4 transition-colors duration-500 ${saveState === "saved" ? "animate-success-ring border-brand-forest/40" : "border-brand-gold/30"}`}>
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-brand-gold-dark" />
                  <p className="m-0 text-sm font-semibold text-brand-text">Extracted invoice data</p>
                  {typeof fields?.parsing_confidence === "number" && (
                    <span className="animate-rise-in ml-auto text-xs font-medium text-brand-muted">
                      {Math.round(fields.parsing_confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                {extracting ? (
                  <ExtractionProgress
                    stage={detailsLoaded ? document.extractedFields?.parsing_stage : undefined}
                    usedOcr={document.extractedFields?.used_ocr}
                  />
                ) : fields ? (
                  <>
                    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                      {EDITABLE_FIELDS.map(({ key, label, numeric }, index) => (
                        <div key={key} className="animate-rise-in" style={{ animationDelay: `${index * 35}ms` }}>
                          <ExtractedField
                            label={label}
                            value={draft[key] ?? ""}
                            numeric={numeric}
                            onChange={next => { setDraft(current => ({ ...current, [key]: next })); setSaveState("idle"); }}
                          />
                        </div>
                      ))}
                    </div>
                    {(fields.line_items?.length ?? 0) > 0 && (
                      <p className="mb-0 mt-3 text-xs text-brand-muted">
                        {fields.line_items!.length} line item(s) detected — review them on the invoice form.
                      </p>
                    )}
                    {(fields.warnings?.length ?? 0) > 0 && (
                      <div className="animate-rise-in mt-3 flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-brand-muted">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-gold-dark" />
                        <ul className="m-0 list-none space-y-0.5 p-0">
                          {fields.warnings!.map((warning, index) => <li key={index}>{warning}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saveState === "saving" || invalidNumbers.length > 0}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-forest px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-forest-light hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saveState === "saving"
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : saveState === "saved"
                            ? <AnimatedCheck className="h-4 w-4" />
                            : <ReceiptText className="h-4 w-4" />}
                        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save details"}
                      </button>
                      <button
                        onClick={onReviewInvoice}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-text ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
                      >
                        Open invoice form
                      </button>
                      {invalidNumbers.length > 0 && (
                        <span className="text-xs text-red-600">
                          {invalidNumbers.map(field => field.label).join(", ")} must be a number.
                        </span>
                      )}
                      {saveState === "error" && <span className="text-xs text-red-600">Could not save. Try again.</span>}
                    </div>
                  </>
                ) : (
                  // Nothing is on its way: either the parser finished without
                  // finding anything, it failed, or the wait was abandoned.
                  // Each says so and offers the form, rather than animating.
                  <ExtractionOutcome
                    state={extractionTimedOut && state === "extracting" ? "timeout" : state === "failed" ? "failed" : "empty"}
                    onOpenForm={onReviewInvoice}
                  />
                )}
              </div>
            )}

            {/* Details */}
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Details</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow icon={Building2} label="Vendor"    value={vendor?.name ?? "Unassigned"} />
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
          </div>
        </section>

        {/* Right — the file itself, given the room a document needs to be read */}
        <section className={`relative flex min-h-[45vh] flex-1 flex-col overflow-hidden bg-gray-100/70 lg:min-h-0 ${extracting ? "ring-1 ring-inset ring-brand-gold/40" : ""}`}>
          {extracting && fileUrl && <ScanBeam />}
          {!fileUrl && !previewError && (
            <div className="grid flex-1 place-items-center px-6 text-sm text-brand-muted">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />Loading preview…
              </span>
            </div>
          )}
          {fileUrl && previewableImage && (
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <img src={fileUrl} alt={document.name} className="mx-auto max-w-full rounded-xl bg-white shadow-sm" />
            </div>
          )}
          {fileUrl && previewablePdf && <iframe src={fileUrl} title={document.name} className="h-full w-full flex-1 border-0 bg-white" />}
          {fileUrl && officePreview?.type === "document" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-3xl rounded-xl bg-white px-6 py-5 text-left text-sm leading-7 text-brand-text shadow-sm">
                {officePreview.lines.length
                  ? officePreview.lines.map((line, index) => <p key={index} className="my-0 border-b border-gray-100 py-1.5 last:border-0">{line}</p>)
                  : <p className="m-0 text-brand-muted">This document has no readable text.</p>}
              </div>
            </div>
          )}
          {fileUrl && officePreview?.type === "spreadsheet" && (
            <div className="flex-1 overflow-auto bg-white text-left">
              <p className="sticky left-0 top-0 z-10 m-0 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-brand-muted">{officePreview.sheet}</p>
              <table className="min-w-full text-xs">
                <tbody>
                  {officePreview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-brand-text">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {fileUrl && officePreview?.type === "binary" && (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div>
                <FileQuestion className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="m-0 text-sm text-brand-muted">A preview is not available for this file.</p>
                <button
                  onClick={() => onDownload?.(document.id)}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-text shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />Download
                </button>
              </div>
            </div>
          )}
          {previewError && (
            <div className="grid flex-1 place-items-center px-6 text-center text-sm text-red-600">
              Preview could not be loaded. Try downloading the file.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Terminal extraction outcomes. Each is a dead end for the automatic path,
 * so each ends on the manual one rather than on an apology. */
const ExtractionOutcome = ({ state, onOpenForm }: { state: "empty" | "failed" | "timeout"; onOpenForm?: () => void }) => {
  const copy = {
    empty:   { icon: FileQuestion,  text: "Nothing could be read from this document. Enter the details by hand on the invoice form." },
    failed:  { icon: TriangleAlert, text: "Extraction failed for this document. Enter the details by hand on the invoice form." },
    timeout: { icon: RotateCw,      text: "Extraction is taking longer than expected. Reopen this document shortly, or fill the invoice form in by hand." },
  }[state];
  const Icon = copy.icon;
  return (
    <div className="animate-rise-in">
      <p className="m-0 flex items-start gap-2 text-sm text-brand-muted">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-dark" />
        <span>{copy.text}</span>
      </p>
      {onOpenForm && (
        <button
          onClick={onOpenForm}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand-text ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
        >
          Open invoice form
        </button>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) => (
  <div>
    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
      <span className="text-sm text-brand-text">{value}</span>
    </div>
  </div>
);

const ExtractedField = ({ label, value, numeric, onChange }: {
  label: string; value: string; numeric?: boolean; onChange: (next: string) => void;
}) => {
  const invalid = numeric && value.trim() !== "" && Number.isNaN(Number(value));
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        inputMode={numeric ? "decimal" : undefined}
        placeholder="Not detected"
        aria-invalid={invalid || undefined}
        className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-brand-text outline-none transition-colors placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 ${invalid ? "border-red-300" : "border-gray-200 focus:border-brand-gold"}`}
      />
    </label>
  );
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day:"2-digit", month:"short", year:"numeric" })
    .format(new Date(`${value}T00:00:00`));
}
