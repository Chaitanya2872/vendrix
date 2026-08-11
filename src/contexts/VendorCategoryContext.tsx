import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VendorCategory } from "@/api/vendorCategories";
import { vendorCategoryApi } from "@/api/vendorCategories";

interface VendorCategoryContextValue {
  categories: VendorCategory[];
  addCategory: (name: string) => Promise<VendorCategory>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const VendorCategoryContext = createContext<VendorCategoryContextValue | null>(null);
export function VendorCategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  useEffect(() => { void vendorCategoryApi.list().then(setCategories).catch(console.error); }, []);

  const value = useMemo<VendorCategoryContextValue>(() => ({
    categories,
    async addCategory(name) {
      const category = await vendorCategoryApi.create(name);
      setCategories(current => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      return category;
    },
    async updateCategory(id, name) {
      const category = await vendorCategoryApi.update(id, name);
      setCategories(current => current.map(item => item.id === id ? category : item));
    },
    async deleteCategory(id) {
      await vendorCategoryApi.remove(id);
      setCategories(current => current.filter(category => category.id !== id));
    },
  }), [categories]);

  return <VendorCategoryContext.Provider value={value}>{children}</VendorCategoryContext.Provider>;
}

export function useVendorCategories() {
  const context = useContext(VendorCategoryContext);
  if (!context) throw new Error("useVendorCategories must be used inside VendorCategoryProvider");
  return context;
}
