import api from "./axios";
export type ApiDocument = { id:string; filename:string; document_type:string; status:string; created_at:string; extracted_fields?:Record<string,unknown> };
export async function listDocuments(): Promise<ApiDocument[]> { const {data} = await api.get<ApiDocument[]>("/documents"); return data; }
export async function uploadDocument(file: File, documentType: string): Promise<ApiDocument> { const form = new FormData(); form.append("file", file); const {data}=await api.post<ApiDocument>(`/documents?document_type=${encodeURIComponent(documentType)}`, form); return data; }
export async function deleteDocument(id: string): Promise<void> { await api.delete(`/documents/${id}`); }
export async function downloadDocument(id: string): Promise<Blob> { const { data } = await api.get(`/documents/${id}/download`, { responseType: "blob" }); return data; }
export type DocumentPreviewData = { type: "document"; lines: string[] } | { type: "spreadsheet"; sheet: string; rows: string[][] } | { type: "binary" };
export async function getDocumentPreview(id: string): Promise<DocumentPreviewData> { const { data } = await api.get<DocumentPreviewData>(`/documents/${id}/preview`); return data; }
export async function lookupPlate(registrationNumber: string) { const {data}=await api.post(`/anpr/lookup?registration_number=${encodeURIComponent(registrationNumber)}`); return data; }
