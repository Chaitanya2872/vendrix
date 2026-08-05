import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Vendor, VendorInput } from "@/types/vendor";
import { vendorApi } from "@/api/vendors";

interface VendorContextValue {
  vendors: Vendor[];
  addVendor: (input: VendorInput) => Promise<Vendor>;
  updateVendor: (id: string, input: VendorInput) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  getVendor: (id: string) => Vendor | undefined;
}

const VendorContext = createContext<VendorContextValue | null>(null);
export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  useEffect(() => { void vendorApi.list().then(setVendors).catch(console.error); }, []);

  const value = useMemo<VendorContextValue>(() => ({
    vendors,
    async addVendor(input) {
      const code = `VEN-${Date.now().toString().slice(-8)}`;
      const vendor = await vendorApi.create(input, code);
      setVendors(current => [vendor, ...current]); return vendor;
    },
    async updateVendor(id, input) {
      const vendor = await vendorApi.update(id, input);
      setVendors(current => current.map(item => item.id === id ? vendor : item));
    },
    async deleteVendor(id) {
      await vendorApi.remove(id); setVendors(current => current.filter(vendor => vendor.id !== id));
    },
    getVendor(id) {
      return vendors.find(vendor => vendor.id === id);
    },
  }), [vendors]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (!context) throw new Error("useVendors must be used inside VendorProvider");
  return context;
}
