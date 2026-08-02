import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { VendorForm } from "@/components/vendors/VendorForm";
import { useVendors } from "@/contexts/VendorContext";

export function EditVendorPage() {
  const { id="" } = useParams(); const navigate=useNavigate(); const { getVendor, updateVendor }=useVendors(); const vendor=getVendor(id);
  if (!vendor) return <Navigate to="/vendors" replace/>;
  const { id:_id, code:_code, registeredOn:_date, ...initialValue } = vendor;
  return <div className="mx-auto max-w-5xl space-y-5"><header className="flex items-start gap-3"><Link to={`/vendors/${id}`} className="rounded-lg border border-brand-border bg-white p-2 text-brand-muted hover:bg-brand-background"><ArrowLeft className="h-5 w-5"/></Link><div><h1 className="m-0 text-2xl font-semibold text-brand-forest">Edit vendor</h1><p className="mb-0 mt-1 text-sm text-brand-muted">Update {vendor.name}.</p></div></header><VendorForm initialValue={initialValue} submitLabel="Save changes" onCancel={()=>navigate(`/vendors/${id}`)} onSubmit={input=>{updateVendor(id,input);navigate(`/vendors/${id}`);}}/></div>;
}
