import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockVendors } from "@/data/mockVendors";
import type { Vendor, VendorInput } from "@/types/vendor";

interface VendorContextValue {
  vendors: Vendor[];
  addVendor: (input: VendorInput) => Vendor;
  updateVendor: (id: string, input: VendorInput) => void;
  deleteVendor: (id: string) => void;
  getVendor: (id: string) => Vendor | undefined;
}

const VendorContext = createContext<VendorContextValue | null>(null);
const STORAGE_KEY = "venqor-vendors";

function loadVendors() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Vendor[]) : mockVendors;
  } catch {
    return mockVendors;
  }
}

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(loadVendors);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors)), [vendors]);

  const value = useMemo<VendorContextValue>(() => ({
    vendors,
    addVendor(input) {
      const vendor: Vendor = {
        ...input,
        id: crypto.randomUUID(),
        code: `VEN-${String(vendors.length + 1).padStart(3, "0")}`,
        registeredOn: new Date().toISOString().slice(0, 10),
      };
      setVendors(current => [vendor, ...current]);
      return vendor;
    },
    updateVendor(id, input) {
      setVendors(current => current.map(vendor => vendor.id === id ? { ...vendor, ...input } : vendor));
    },
    deleteVendor(id) {
      setVendors(current => current.filter(vendor => vendor.id !== id));
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
