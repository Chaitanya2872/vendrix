import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { VendorForm } from "@/components/vendors/VendorForm";
import { useVendors } from "@/contexts/VendorContext";

/** Where to go once the vendor exists. Pickers elsewhere send the user here
 * mid-task and pass the page they came from as `returnTo`; anything else
 * lands on the vendor list. Only same-site paths are honoured, so a crafted
 * link cannot turn this into an open redirect. */
function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function AddVendorPage() {
  const navigate = useNavigate();
  const { addVendor } = useVendors();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const back = returnTo ?? "/vendors";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex items-start gap-3">
        <Link to={back} className="rounded-lg border border-brand-border bg-white p-2 text-brand-muted hover:bg-brand-background">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="m-0 text-2xl font-semibold text-brand-forest">Add vendor</h1>
          <p className="mb-0 mt-1 text-sm text-brand-muted">
            {returnTo ? "Create the vendor, and we'll take you back to what you were doing." : "Create a new vendor profile."}
          </p>
        </div>
      </header>
      <VendorForm
        submitLabel="Create vendor"
        onCancel={() => navigate(back)}
        onSubmit={async input => {
          await addVendor(input);
          // The context already holds the new vendor, so the picker on the
          // page we return to lists it without another round trip.
          navigate(back);
        }}
      />
    </div>
  );
}
