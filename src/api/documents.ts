import api from "./axios";

export type ApiDocument = {
  id: string;
  filename: string;
  document_type: string;
  status: string;
  created_at: string;
  /** Owning vendor, chosen at upload. Null for documents uploaded before the
   * field existed, and for uploads where no vendor was picked. */
  vendor_id?: string | null;
  expires_on?: string | null;
  size_bytes?: number | null;
  extracted_fields?: Record<string, unknown>;
  review_confirmed_at?: string | null;
};

// Parsed-invoice shape mirrors ParsedInvoiceResult on the backend
// (app/modules/invoices/dto.py) as stored in Document.extracted_fields
// once invoice_parser_service finishes processing an INVOICE document.
// Every field is optional: the parser only fills in what it could find.
export type ExtractedInvoiceLineItem = {
  description?: string | null;
  hsn_sac?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  gst_rate?: number | null;
  taxable_value?: number | null;
  total_amount?: number | null;
};

/** Stage names published by invoice_parser_service while parsing runs (see
 * PARSING_STAGES there). Ordered — the UI renders them as a checklist. */
export const EXTRACTION_STAGES = ["reading", "extracting_text", "detecting_fields", "saving"] as const;
export type ExtractionStage = (typeof EXTRACTION_STAGES)[number];

export type ExtractedInvoiceFields = {
  /** Present only while extraction is still running: this payload is a
   * progress update, not a result. The finished write omits it. */
  in_progress?: boolean;
  parsing_stage?: ExtractionStage;
  used_ocr?: boolean | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  vendor_name?: string | null;
  vendor_gstin?: string | null;
  customer_name?: string | null;
  customer_gstin?: string | null;
  subtotal?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  line_items?: ExtractedInvoiceLineItem[];
  parsing_confidence?: number | null;
  warnings?: string[];
  validation_errors?: string[];
};

// Document.status values used by the extraction/review workflow (see
// documents/router.py's review endpoint, which sets "CONFIRMED"). Invoice
// parsing reuses the same field rather than inventing a parallel one.
export type DocumentReviewStatus = "UPLOADED" | "PROCESSING" | "REVIEW_REQUIRED" | "CONFIRMED" | "FAILED" | string;

export async function listDocuments(): Promise<ApiDocument[]> {
  const { data } = await api.get<ApiDocument[]>("/documents");
  return data;
}

export async function getDocument(id: string): Promise<ApiDocument> {
  const { data } = await api.get<ApiDocument>(`/documents/${id}`);
  return data;
}

export type UploadOptions = {
  /** Owning vendor. Optional — the backend stores the document unassigned
   * when it is omitted, which is what "no vendor yet" has to mean while the
   * user is still creating one. */
  vendorId?: string;
  /** ISO yyyy-mm-dd. */
  expiresOn?: string;
  onProgress?: (percent: number) => void;
};

/** `onProgress` reports 0–100 as the file is sent. The final few percent are
 * the server's own processing time, which the browser can't observe, so the
 * caller should keep showing activity until the promise resolves. */
export async function uploadDocument(
  file: File,
  documentType: string,
  options: UploadOptions = {},
): Promise<ApiDocument> {
  const { vendorId, expiresOn, onProgress } = options;
  const form = new FormData();
  form.append("file", file);
  const params = new URLSearchParams({ document_type: documentType });
  if (vendorId) params.set("vendor_id", vendorId);
  if (expiresOn) params.set("expires_on", expiresOn);
  const { data } = await api.post<ApiDocument>(
    `/documents?${params.toString()}`,
    form,
    onProgress && {
      onUploadProgress: event => {
        // event.total is absent when the size isn't known up front.
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string): Promise<Blob> {
  const { data } = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  return data;
}

export type DocumentPreviewData =
  | { type: "document"; lines: string[] }
  | { type: "spreadsheet"; sheet: string; rows: string[][] }
  | { type: "binary" };

export async function getDocumentPreview(id: string): Promise<DocumentPreviewData> {
  const { data } = await api.get<DocumentPreviewData>(`/documents/${id}/preview`);
  return data;
}

/** Confirm (or correct) extraction results — same endpoint the generic
 * review workflow already exposes. Used both for invoice review and any
 * other extraction type the Documents module supports. */
export async function reviewDocument(id: string, fields: Record<string, unknown>): Promise<ApiDocument> {
  const { data } = await api.post<ApiDocument>(`/documents/${id}/review`, { fields });
  return data;
}

/** Maps the raw backend document status to the UI's five-value status enum
 * used across DocumentsPage/DocumentPreview. Centralised here so upload and
 * initial-load paths never drift out of sync with each other again. */
export function toDocumentUiStatus(status: string): "Valid" | "Under review" | "Draft" {
  if (status === "REVIEW_REQUIRED" || status === "PROCESSING") return "Under review";
  if (status === "CONFIRMED") return "Valid";
  return "Draft";
}

/** What the UI should show for a document whose extraction it is waiting on.
 *
 * Derived from the *status* first and the payload second. Reading only the
 * payload — "no fields yet means still working" — is what left the preview
 * spinning forever on documents whose parse had already finished and found
 * nothing, or had failed: neither writes a field the poller was waiting for. */
export type ExtractionState = "extracting" | "ready" | "empty" | "failed";

export function extractionState(
  status: string,
  fields: ExtractedInvoiceFields | undefined,
): ExtractionState {
  if (status === "FAILED") return "failed";
  if (fields?.in_progress) return "extracting";
  // A terminal status with no payload means the parser finished without
  // producing anything, not that results are still on their way.
  if (fields != null) return "ready";
  if (status === "UPLOADED" || status === "PROCESSING") return "extracting";
  return "empty";
}

export async function lookupPlate(registrationNumber: string) {
  const { data } = await api.post(`/anpr/lookup?registration_number=${encodeURIComponent(registrationNumber)}`);
  return data;
}
