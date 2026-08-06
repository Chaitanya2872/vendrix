import api from "./axios";

export type VendorOption = { id: string; legal_name: string; vendor_code: string };
export type Vehicle = { id:string; vendor_id:string; registration_number:string; vehicle_type:string; make?:string; model?:string; rc_expiry?:string; insurance_expiry?:string; status:string; created_at:string };
export type Invoice = { id:string; vendor_id:string; invoice_number:string; invoice_date:string; due_date?:string; amount:number; tax_amount:number; status:string; created_at:string };
export type UserProfile = { id:string; email:string; full_name:string; role:string; is_active?:boolean; created_at?:string };
export type Approval = { id:string; resource_type:string; resource_id:string; status:string; requested_by:string; created_at:string };
export type AuditLog = { id:string; action:string; resource_type:string; resource_id:string; actor_id?:string; created_at:string };
export type Summary = { vendors:number; active_vehicles:number; pending_approvals:number; invoice_total:number; paid_total:number };

const PAGE_SIZE = 200;
const list = async <T>(path:string) => {
  const { data } = await api.get<T[] | { items?: T[]; total?: number }>(path, { params: { limit: PAGE_SIZE } });
  if (Array.isArray(data)) return data;
  if (!Array.isArray(data.items)) throw new Error(`Unexpected list response from ${path}`);
  const records = [...data.items];
  const total = data.total ?? records.length;
  while (records.length < total) {
    const { data: page } = await api.get<{ items: T[] }>(path, { params: { limit: PAGE_SIZE, offset: records.length } });
    if (!page.items?.length) break;
    records.push(...page.items);
  }
  return records;
};
export const operationsApi = {
  vendors: () => list<VendorOption>("/vendors"),
  vehicles: () => list<Vehicle>("/vehicles"),
  createVehicle: (payload: Omit<Vehicle, "id" | "created_at">) => api.post<Vehicle>("/vehicles", payload).then(r => r.data),
  invoices: () => list<Invoice>("/invoices"),
  createInvoice: (payload: Pick<Invoice, "vendor_id" | "invoice_number" | "invoice_date" | "due_date" | "amount" | "tax_amount">) => api.post<Invoice>("/invoices", payload).then(r => r.data),
  submitInvoice: (id:string) => api.post(`/invoices/${id}/submit`),
  me: () => api.get<UserProfile>("/auth/me").then(r => r.data),
  users: () => api.get<UserProfile[]>("/users").then(r => r.data),
  summary: () => api.get<Summary>("/reports/summary").then(r => r.data),
  approvals: () => api.get<Approval[]>("/approvals").then(r => r.data),
  auditLogs: () => api.get<AuditLog[]>("/audit-logs", { params: { limit: 500 } }).then(r => r.data),
};
