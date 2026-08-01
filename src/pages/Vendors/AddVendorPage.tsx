import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { VendorForm } from "@/components/vendors/VendorForm";
import { useVendors } from "@/context/VendorContext";

export function AddVendorPage() {
  const navigate = useNavigate(); const { addVendor } = useVendors();
  return <div className="mx-auto max-w-5xl space-y-5"><header className="flex items-start gap-3"><Link to="/vendors" className="rounded-lg border border-brand-border bg-white p-2 text-brand-muted hover:bg-brand-background"><ArrowLeft className="h-5 w-5"/></Link><div><h1 className="m-0 text-2xl font-semibold text-brand-forest">Add vendor</h1><p className="mb-0 mt-1 text-sm text-brand-muted">Create a new vendor profile.</p></div></header><VendorForm submitLabel="Create vendor" onCancel={()=>navigate("/vendors")} onSubmit={input=>{ const vendor=addVendor(input); navigate(`/vendors/${vendor.id}`); }}/></div>;
}
