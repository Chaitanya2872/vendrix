import api from "./axios";
import type { Vendor, VendorInput } from "@/types/vendor";

type ApiVendor = { id:string; vendor_code:string; legal_name:string; category?:string; status:string; phone?:string; email?:string; gstin?:string; address?: Record<string, string>; created_at?:string };
const status = (value: string): Vendor["status"] => value === "ACTIVE" ? "Active" : value === "INACTIVE" ? "Inactive" : "Pending";
const toUi = (v: ApiVendor): Vendor => ({ id:v.id, code:v.vendor_code, name:v.legal_name, category:v.category ?? "", contactPerson:v.address?.contactPerson ?? "", email:v.email ?? "", phone:v.phone ?? "", gstin:v.gstin ?? "", address:v.address?.address ?? "", city:v.address?.city ?? "", state:v.address?.state ?? "", status:status(v.status), rating:0, registeredOn:v.created_at?.slice(0,10) ?? "", notes:v.address?.notes ?? "", paymentTerms:v.address?.paymentTerms ?? "", creditLimit:v.address?.creditLimit ?? "", billingDetails:v.address?.billingDetails ?? "", serviceDescription:v.address?.serviceDescription ?? "", deliveryTimeline:v.address?.deliveryTimeline ?? "", taxDocuments:v.address?.taxDocuments ?? "", certificationStatus:v.address?.certificationStatus ?? "" });
const payload = (input: VendorInput, code?: string) => ({ vendor_code:code, legal_name:input.name, category:input.category, gstin:input.gstin || null, status:input.status.toUpperCase(), phone:input.phone, email:input.email, address:{address:input.address, city:input.city, state:input.state, contactPerson:input.contactPerson, notes:input.notes, paymentTerms:input.paymentTerms, creditLimit:input.creditLimit, billingDetails:input.billingDetails, serviceDescription:input.serviceDescription, deliveryTimeline:input.deliveryTimeline, taxDocuments:input.taxDocuments, certificationStatus:input.certificationStatus} });
export const vendorApi = {
  async list() {
    const { data } = await api.get<ApiVendor[] | { items?: ApiVendor[] }>("/vendors");
    const records = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(records)) throw new Error("Unexpected vendor list response");
    return records.map(toUi);
  },
  async create(input: VendorInput, code: string) { const {data}=await api.post<ApiVendor>("/vendors", payload(input, code)); return toUi(data); },
  async update(id: string, input: VendorInput) { const {data}=await api.patch<ApiVendor>(`/vendors/${id}`, payload(input)); return toUi(data); },
  async remove(id: string) { await api.delete(`/vendors/${id}`); },
};
