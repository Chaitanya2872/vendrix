import api from "./axios";

export type ApiDocument = {
  id: string;
  filename: string;
  document_type: string;
  status: string;
  created_at: string;
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

/** `onProgress` reports 0–100 as the file is sent. The final few percent are
 * the server's own processing time, which the browser can't observe, so the
 * caller should keep showing activity until the promise resolves. */
export async function uploadDocument(
  file: File,
  documentType: string,
  onProgress?: (percent: number) => void,
): Promise<ApiDocument> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiDocument>(
    `/documents?document_type=${encodeURIComponent(documentType)}`,
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

export async function lookupPlate(registrationNumber: string) {
  const { data } = await api.post(`/anpr/lookup?registration_number=${encodeURIComponent(registrationNumber)}`);
  return data;
}
