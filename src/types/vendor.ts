export type VendorStatus = "Active" | "Pending" | "Inactive";

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  status: VendorStatus;
  rating: number;
  registeredOn: string;
  notes: string;
}

export type VendorInput = Omit<Vendor, "id" | "code" | "registeredOn">;
