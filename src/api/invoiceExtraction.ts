import api from "./axios";

/**
 * Client for the invoice OCR pipeline.
 *
 * Kept separate from documents.ts, which serves the generic vendor-document
 * workflow. The two share a Document row on the server but almost nothing
 * else: this one is about a long-running extraction with progress, evidence
 * and a review step, and merging them would leave every consumer guessing
 * which half of a union type it was holding.
 */

// ─── Pipeline vocabulary ───────────────────────────────────────────────────
// Mirrors app/modules/documents/stages.py. Status is the lifecycle — is this
// still working? Stage is the position within the pipeline, which is what a
// progress caption names. One field cannot answer both questions.

export const PROCESSING_STATUSES = [
  "UPLOADED", "PROCESSING", "COMPLETED", "REVIEW_REQUIRED", "FAILED",
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const PIPELINE_STAGES = [
  "UPLOADED",
  "FILE_VALIDATION",
  "PDF_ANALYSIS",
  "IMAGE_PREPROCESSING",
  "OCR_PROCESSING",
  "LAYOUT_ANALYSIS",
  "TABLE_EXTRACTION",
  "FIELD_EXTRACTION",
  "LINE_ITEM_EXTRACTION",
  "VALIDATING",
  "PERSISTING",
  "COMPLETED",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** A status nothing further will happen to without a human or a reprocess. */
export const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  "COMPLETED", "REVIEW_REQUIRED", "FAILED",
]);

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

// ─── Payloads ──────────────────────────────────────────────────────────────

export type UploadAccepted = {
  document_id: string;
  filename: string;
  status: string;
  file_format: string;
  size_bytes: number;
  page_count: number | null;
  /** Set when an identical file was already uploaded — the client should
   * jump to that document rather than wait for a second identical OCR pass. */
  duplicate_of: string | null;
};

export type ProcessingError = { code: string; message: string };

export type ProcessingStatusPayload = {
  document_id: string;
  filename: string;
  status: ProcessingStatus | string;
  progress: number;
  current_stage: PipelineStage | string;
  stage_label: string;
  attempt?: number | null;
  page_count?: number | null;
  used_ocr?: boolean | null;
  ocr_confidence?: number | null;
  extraction_confidence?: number | null;
  duration_seconds?: number | null;
  error?: ProcessingError | null;
};

/** A box in *extraction* pixel space. The page image is rendered smaller for
 * display, so every box must be scaled by (renderDpi / extractionDpi) before
 * it is drawn. `pageImageUrl` returns both numbers for exactly this. */
export type EvidenceBox = { x: number; y: number; width: number; height: number };

export type FieldEvidence = {
  field?: string;
  value?: string;
  page_number: number;
  box: EvidenceBox | null;
  score: number;
  margin: number;
  reasons: string[];
};

export type FieldConfidence = {
  field: string;
  confidence: number;
  extraction_score: number;
  margin: number;
  ocr_confidence: number;
  needs_attention: boolean;
  penalised_by: string[];
};

export type ConfidenceReport = {
  document_confidence: number;
  needs_review: boolean;
  capped_by_errors: boolean;
  line_item_confidence: number | null;
  missing_required: string[];
  fields_needing_attention: string[];
  fields: Record<string, FieldConfidence>;
};

export type ExtractedLineItem = {
  description?: string | null;
  hsn_sac?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  gst_rate?: number | null;
  taxable_value?: number | null;
  total_amount?: number | null;
};

export type ExtractedFields = {
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  vendor_name?: string | null;
  vendor_gstin?: string | null;
  customer_name?: string | null;
  customer_gstin?: string | null;
  subtotal?: number | null;
  taxable_amount?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  tax_amount?: number | null;
  round_off?: number | null;
  total_amount?: number | null;
  line_items?: ExtractedLineItem[];
  parsing_confidence?: number | null;
  warnings?: string[];
  validation_errors?: string[];
  [key: string]: unknown;
};

export type ExtractionResult = {
  document_id: string;
  filename: string;
  status: string;
  page_count: number | null;
  used_ocr: boolean | null;
  fields: ExtractedFields;
  evidence: Record<string, FieldEvidence> | null;
  confidence: ConfidenceReport | null;
  invoice_id: string | null;
  reviewed_at: string | null;
};

// ─── Calls ─────────────────────────────────────────────────────────────────

export async function uploadInvoice(
  file: File,
  options: { reprocessDuplicates?: boolean; onProgress?: (percent: number) => void } = {},
): Promise<UploadAccepted> {
  const form = new FormData();
  form.append("file", file);
  if (options.reprocessDuplicates) form.append("reprocess_duplicates", "true");

  const { data } = await api.post<UploadAccepted>("/invoices/upload", form, {
    onUploadProgress: event => {
      // `total` is absent when the size is not known up front. Even at 100%
      // the server has only *received* the file — extraction has not started
      // — so the caller must keep showing activity until polling takes over.
      if (event.total && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}

export async function getProcessingStatus(documentId: string): Promise<ProcessingStatusPayload> {
  const { data } = await api.get<ProcessingStatusPayload>(
    `/invoices/${encodeURIComponent(documentId)}/status`,
  );
  return data;
}

export async function getExtractionResult(documentId: string): Promise<ExtractionResult> {
  const { data } = await api.get<ExtractionResult>(
    `/invoices/${encodeURIComponent(documentId)}/result`,
  );
  return data;
}

export async function reprocessInvoice(documentId: string): Promise<ProcessingStatusPayload> {
  const { data } = await api.post<ProcessingStatusPayload>(
    `/invoices/${encodeURIComponent(documentId)}/reprocess`,
  );
  return data;
}

export async function submitCorrections(
  documentId: string,
  fields: Record<string, unknown>,
  confirm = true,
): Promise<{ document_id: string; status: string; corrected_fields: string[] }> {
  const { data } = await api.post(
    `/invoices/${encodeURIComponent(documentId)}/corrections`,
    { fields, confirm },
  );
  return data;
}

/**
 * Fetch a rendered page along with the scale needed to place evidence boxes
 * on it.
 *
 * Returned as an object URL rather than a plain `<img src>` because the API
 * requires an Authorization header, which a bare `src` cannot carry. The
 * caller owns the URL and must revoke it — see `useEffect` cleanup in
 * InvoicePageViewer.
 */
export async function fetchPageImage(
  documentId: string,
  pageNumber: number,
  dpi = 150,
): Promise<{ objectUrl: string; renderDpi: number; extractionDpi: number; scale: number }> {
  const response = await api.get(
    `/invoices/${encodeURIComponent(documentId)}/pages/${pageNumber}`,
    { params: { dpi }, responseType: "blob" },
  );

  const renderDpi = Number(response.headers["x-render-dpi"]) || dpi;
  const extractionDpi = Number(response.headers["x-extraction-dpi"]) || 300;

  return {
    objectUrl: URL.createObjectURL(response.data as Blob),
    renderDpi,
    extractionDpi,
    // Evidence boxes are in extraction pixels; the image is in render
    // pixels. Everything drawn over the page must go through this.
    scale: renderDpi / extractionDpi,
  };
}

// ─── Presentation helpers ──────────────────────────────────────────────────

/** Confidence bands. Deliberately three, not a continuous gradient: a
 * reviewer needs to know whether to check a field, not what its score was to
 * two decimal places. */
export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(confidence: number | null | undefined): ConfidenceBand {
  if (confidence == null) return "low";
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

export const CONFIDENCE_STYLES: Record<ConfidenceBand, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-red-200 bg-red-50 text-red-900",
};

/** Human labels for the fields the review form edits, in the order a person
 * reads an invoice rather than the order the parser produced them. */
export const FIELD_LABELS: Record<string, string> = {
  invoice_number: "Invoice number",
  invoice_date: "Invoice date",
  due_date: "Due date",
  vendor_name: "Supplier",
  vendor_gstin: "Supplier GSTIN",
  customer_name: "Customer",
  customer_gstin: "Customer GSTIN",
  subtotal: "Subtotal",
  taxable_amount: "Taxable value",
  cgst_amount: "CGST",
  sgst_amount: "SGST",
  igst_amount: "IGST",
  tax_amount: "Total tax",
  round_off: "Round off",
  total_amount: "Total",
};

export const REVIEW_FIELD_ORDER: string[] = [
  "invoice_number", "invoice_date", "due_date",
  "vendor_name", "vendor_gstin",
  "customer_name", "customer_gstin",
  "subtotal", "taxable_amount",
  "cgst_amount", "sgst_amount", "igst_amount", "tax_amount",
  "round_off", "total_amount",
];

export const MONEY_FIELDS: ReadonlySet<string> = new Set([
  "subtotal", "taxable_amount", "cgst_amount", "sgst_amount",
  "igst_amount", "tax_amount", "round_off", "total_amount",
]);

export const DATE_FIELDS: ReadonlySet<string> = new Set(["invoice_date", "due_date"]);
