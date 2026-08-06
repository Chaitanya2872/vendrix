import api from "./axios";

export type Page<T> = { items: T[]; total: number; limit: number; offset: number };
export type VendorOption = { id: string; legal_name: string; vendor_code: string };
export type VehicleOption = { id: string; vendor_id: string; registration_number: string; vehicle_type: string; status: string };
export type DriverOption = { id: string; vendor_id: string; vehicle_id?: string; full_name: string; phone: string; status: string };
export type Purchase = { id:string; purchase_number:string; vendor_id:string; vendor_name?:string; reference?:string; quantity:number; total_amount:number; expected_date?:string; status:string; notes?:string; created_at:string };
export type Delivery = { id:string; delivery_number:string; vendor_id:string; vendor_name?:string; purchase_id?:string; purchase_number?:string; vehicle_id?:string; vehicle_number?:string; driver_id?:string; driver_name?:string; driver_phone?:string; destination:string; recipient?:string; scheduled_at:string; status:string; notes?:string; created_at:string };
export type PurchaseInput = Omit<Purchase, "id"|"vendor_name"|"created_at">;
export type DeliveryInput = Omit<Delivery, "id"|"vendor_name"|"purchase_number"|"vehicle_number"|"driver_name"|"driver_phone"|"created_at"|"vendor_id"|"purchase_id"|"vehicle_id"|"driver_id"|"recipient"|"notes"> & { vendor_id?: string; purchase_id?: string; vehicle_id?: string; driver_id?: string; recipient?: string; notes?: string };
const list = <T,>(path:string) => api.get<Page<T>>(path).then(r => r.data);
export const procurementApi = {
  purchases: (params?: {status?:string;limit?:number;offset?:number}) => list<Purchase>("/purchases" + (params ? `?${new URLSearchParams(Object.entries(params).filter(([,v])=>v !== undefined) as [string,string][]).toString()}` : "")),
  purchase: (id:string) => api.get<Purchase>(`/purchases/${id}`).then(r=>r.data),
  createPurchase: (body:PurchaseInput) => api.post<Purchase>("/purchases", body).then(r=>r.data),
  updatePurchase: (id:string, body:Partial<PurchaseInput>) => api.patch<Purchase>(`/purchases/${id}`,body).then(r=>r.data),
  deliveries: (params?: {status?:string;limit?:number;offset?:number}) => list<Delivery>("/deliveries" + (params ? `?${new URLSearchParams(Object.entries(params).filter(([,v])=>v !== undefined) as [string,string][]).toString()}` : "")),
  delivery: (id:string) => api.get<Delivery>(`/deliveries/${id}`).then(r=>r.data),
  createDelivery: (body:DeliveryInput) => api.post<Delivery>("/deliveries",body).then(r=>r.data),
  updateDelivery: (id:string, body:Partial<DeliveryInput>) => api.patch<Delivery>(`/deliveries/${id}`,body).then(r=>r.data),
  vendors: () => list<VendorOption>("/vendors").then(r=>r.items),
  vehicles: () => list<VehicleOption>("/vehicles").then(r=>r.items),
  drivers: () => list<DriverOption>("/drivers").then(r=>r.items),
};
