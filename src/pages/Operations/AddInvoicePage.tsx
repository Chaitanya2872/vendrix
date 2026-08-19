import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ReceiptText, TriangleAlert, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { operationsApi, type VendorOption } from "@/api/operations";
import { Busy, inputClass, Panel, PageIntro, primaryButtonClass, Problem } from "@/pages/Operations/operation-ui";

// Shape handed off from DocumentsPage when a user reviews a parsed invoice
// document (see DocumentsPage.tsx's onReviewInvoice). Every field is
// optional — this page works exactly as before when someone lands here
// directly (no navigation state at all).
type InvoicePrefillState = {
  documentId?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  amount?: number;
  tax_amount?: number;
  vendor_gstin?: string;
  vendor_name?: string;
  warnings?: string[];
  validation_errors?: string[];
  parsing_confidence?: number;
  line_items?: Array<{
    description?: string | null;
    hsn_sac?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    gst_rate?: number | null;
    total_amount?: number | null;
  }>;
};

export function AddInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state ?? {}) as InvoicePrefillState;
  const isFromParsedDocument = Boolean(prefill.documentId);

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void operationsApi.vendors().then(setVendors).catch(() => setError("Vendors could not be loaded. Create a vendor first.")).finally(() => setLoading(false));
  }, []);

  // Best-effort vendor preselection: match the extracted vendor name against
  // the vendor list. Never assumed to be right — it's only a starting point
  // the user can change, and quietly does nothing if there's no match.
  const suggestedVendorId = useMemo(() => {
    if (!prefill.vendor_name || !vendors.length) return "";
    const needle = prefill.vendor_name.trim().toLowerCase();
    return vendors.find(v => v.legal_name.trim().toLowerCase() === needle)?.id ?? "";
  }, [prefill.vendor_name, vendors]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await operationsApi.createInvoice({
        vendor_id: String(data.get("vendor_id")),
        invoice_number: String(data.get("invoice_number")),
        invoice_date: String(data.get("invoice_date")),
        due_date: String(data.get("due_date")) || undefined,
        amount: Number(data.get("amount")),
        tax_amount: Number(data.get("tax_amount") || 0),
        ...(prefill.documentId ? { document_id: prefill.documentId } : {}),
      });
      navigate("/invoices");
    } catch {
      setError("Invoice could not be saved. Check the invoice number and amounts.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5">
      <PageIntro eyebrow="Finance desk" title="Add invoice">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-forest hover:underline">
          <ArrowLeft className="h-4 w-4" />Back to invoices
        </Link>
      </PageIntro>

      {isFromParsedDocument && (
        <div className="rounded-xl border border-brand-gold/30 bg-amber-50/40 px-5 py-4">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-gold-dark" />
            <p className="m-0 text-sm font-semibold text-brand-text">Fields pre-filled from the uploaded document</p>
            {typeof prefill.parsing_confidence === "number" && (
              <span className="ml-auto text-xs font-medium text-brand-muted">{Math.round(prefill.parsing_confidence * 100)}% confidence</span>
            )}
          </div>
          <p className="m-0 text-sm text-brand-muted">Review every field below before saving — nothing is final until you submit.</p>
          {(prefill.warnings?.length || prefill.validation_errors?.length) ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-brand-muted">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-gold-dark" />
              <ul className="m-0 list-none space-y-0.5 p-0">
                {[...(prefill.validation_errors ?? []), ...(prefill.warnings ?? [])].map((message, index) => <li key={index}>{message}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <Panel>
        {loading ? <Busy /> : error && !vendors.length ? <Problem message={error} /> : (
          <form onSubmit={submit} className="p-5 md:p-7">
            <div className="mb-6 border-b border-brand-border pb-5">
              <h2 className="m-0 text-lg font-semibold text-brand-forest">Billing details</h2>
              <p className="mb-0 mt-1 text-sm text-brand-muted">Create a draft invoice, then submit it for approval from the register.</p>
            </div>
            {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Vendor">
                <select required name="vendor_id" defaultValue={suggestedVendorId} className={inputClass}>
                  <option value="">Choose vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.legal_name}</option>)}
                </select>
                {prefill.vendor_gstin && !suggestedVendorId && (
                  <span className="text-xs text-brand-muted">Extracted GSTIN {prefill.vendor_gstin} didn't match an existing vendor — pick one manually.</span>
                )}
              </Field>
              <Field label="Invoice number">
                <input required name="invoice_number" defaultValue={prefill.invoice_number ?? ""} className={inputClass} />
              </Field>
              <Field label="Invoice date">
                <input required name="invoice_date" type="date" defaultValue={prefill.invoice_date ?? ""} className={inputClass} />
              </Field>
              <Field label="Due date">
                <input name="due_date" type="date" defaultValue={prefill.due_date ?? ""} className={inputClass} />
              </Field>
              <Field label="Amount before tax">
                <input required min=".01" step=".01" name="amount" type="number" defaultValue={prefill.amount ?? ""} className={inputClass} />
              </Field>
              <Field label="Tax amount">
                <input min="0" step=".01" name="tax_amount" type="number" defaultValue={prefill.tax_amount ?? 0} className={inputClass} />
              </Field>
            </div>

            {(prefill.line_items?.length ?? 0) > 0 && (
              <div className="mt-7 border-t border-brand-border pt-5">
                <h3 className="m-0 mb-3 text-sm font-semibold text-brand-forest">Extracted line items</h3>
                <p className="mb-3 mt-0 text-xs text-brand-muted">Shown for reference — line items are saved automatically against this invoice once linked to the source document.</p>
                <div className="overflow-x-auto rounded-xl ring-1 ring-brand-border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-brand-background/60 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      <tr><th className="px-4 py-2">Description</th><th className="px-4 py-2">HSN/SAC</th><th className="px-4 py-2">Qty</th><th className="px-4 py-2">Rate</th><th className="px-4 py-2">GST %</th><th className="px-4 py-2">Amount</th></tr>
                    </thead>
                    <tbody>
                      {prefill.line_items!.map((item, index) => (
                        <tr key={index} className="border-t border-brand-border">
                          <td className="px-4 py-2">{item.description ?? "—"}</td>
                          <td className="px-4 py-2">{item.hsn_sac ?? "—"}</td>
                          <td className="px-4 py-2">{item.quantity ?? "—"}</td>
                          <td className="px-4 py-2">{item.unit_price ?? "—"}</td>
                          <td className="px-4 py-2">{item.gst_rate ?? "—"}</td>
                          <td className="px-4 py-2">{item.total_amount ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3 border-t border-brand-border pt-5">
              <Link to="/invoices" className="rounded-lg px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-background">Cancel</Link>
              <button disabled={saving} className={primaryButtonClass}>
                <ReceiptText className="h-4 w-4" />{saving ? "Saving…" : "Save draft"}
              </button>
            </div>
          </form>
        )}
      </Panel>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-brand-text"><span>{label}</span>{children}</label>;
}
