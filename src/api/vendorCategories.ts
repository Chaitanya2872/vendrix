import api from "./axios";

export type VendorCategory = { id: string; name: string; created_at?: string };

export const vendorCategoryApi = {
  async list(): Promise<VendorCategory[]> {
    const { data } = await api.get<{ items: VendorCategory[] }>("/vendor-categories", { params: { limit: 200 } });
    return data.items;
  },
  async create(name: string): Promise<VendorCategory> {
    const { data } = await api.post<VendorCategory>("/vendor-categories", { name });
    return data;
  },
  async update(id: string, name: string): Promise<VendorCategory> {
    const { data } = await api.patch<VendorCategory>(`/vendor-categories/${id}`, { name });
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/vendor-categories/${id}`);
  },
};
