import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, FileWarning,
  Info, Loader2, RefreshCw, ScanLine, Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONFIDENCE_STYLES, DATE_FIELDS, FIELD_LABELS, MONEY_FIELDS,
  REVIEW_FIELD_ORDER, confidenceBand, getExtractionResult, reprocessInvoice,
  submitCorrections,
  type ExtractionResult, type FieldEvidence,
} from "@/api/invoiceExtraction";
import { useExtractionStatus } from "@/hooks/useExtractionStatus";
import { InvoicePageViewer, type Highlight } from "@/components/invoices/InvoicePageViewer";

/**
 * Side-by-side review: the document on the left, what was read from it on
 * the right, and a line between the two.
 *
 * The design assumption is that a reviewer's expensive act is *locating* a
 * value on the page, not typing a correction. So selecting a field
 * highlights its source region, low-confidence fields are flagged before
 * they are asked about, and validation findings say what does not add up
 * rather than only that something does not.
 */

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (MONEY_FIELDS.has(field) && typeof value === "number") return value.toFixed(2);
  return String(value);
}

export function InvoiceReviewPage() {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tracked separately from the hook's own `finished`: using that to
  // configure the hook that produces it would be circular. Once the result
  // has loaded there is nothing left to poll for.
  const [resultLoaded, setResultLoaded] = useState(false);

  const { status, finished, pollError } = useExtractionStatus(documentId, {
    enabled: !resultLoaded,
  });

  const applyResult = useCallback((payload: ExtractionResult) => {
    setResult(payload);
    setDraft(
      Object.fromEntries(
        REVIEW_FIELD_ORDER.map(field => [field, formatValue(field, payload.fields[field])]),
      ),
    );
    setLoadError(null);
    setResultLoaded(true);
  }, []);

  /** Re-fetch after saving, or after a reprocess. */
  const loadResult = useCallback(async () => {
    try {
      applyResult(await getExtractionResult(documentId));
    } catch {
      setLoadError("Could not load this extraction.");
    }
  }, [applyResult, documentId]);

  useEffect(() => {
    if (!finished) return;
    // `ignore` rather than a bare call: the reviewer can navigate away or
    // switch documents while this request is in flight, and a late response
    // would otherwise overwrite the screen with the previous invoice.
    let ignore = false;
    void (async () => {
      try {
        const payload = await getExtractionResult(documentId);
        if (!ignore) applyResult(payload);
      } catch {
        if (!ignore) setLoadError("Could not load this extraction.");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [finished, documentId, applyResult]);

  // Memoised because it feeds a dependency list: a fresh {} on every render
  // would rebuild every highlight on every keystroke in the form.
  const evidence: Record<string, FieldEvidence> = useMemo(
    () => result?.evidence ?? {},
    [result],
  );
  const confidence = result?.confidence ?? null;

  const highlights: Highlight[] = useMemo(
    () =>
      Object.entries(evidence)
        .filter(([, item]) => item.box)
        .map(([field, item]) => ({
          field,
          pageNumber: item.page_number || 1,
          box: item.box!,
          active: field === selectedField,
        })),
    [evidence, selectedField],
  );

  const activePage = selectedField ? evidence[selectedField]?.page_number : undefined;

  const dirtyFields = useMemo(() => {
    if (!result) return [];
    return REVIEW_FIELD_ORDER.filter(
      field => draft[field] !== formatValue(field, result.fields[field]),
    );
  }, [draft, result]);

  const save = async (confirm: boolean) => {
    if (!result) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of REVIEW_FIELD_ORDER) {
        const raw = draft[field] ?? "";
        if (raw === "") {
          payload[field] = null;
        } else if (MONEY_FIELDS.has(field)) {
          const parsed = Number(raw.replace(/,/g, ""));
          // A value that is not a number is kept as typed rather than
          // silently coerced to 0 — losing a total to a stray character is
          // exactly the failure this whole screen exists to prevent.
          payload[field] = Number.isFinite(parsed) ? parsed : raw;
        } else {
          payload[field] = raw;
        }
      }
      await submitCorrections(documentId, payload, confirm);
      toast.success(confirm ? "Invoice confirmed" : "Changes saved");
      if (confirm) navigate("/invoices");
      else await loadResult();
    } catch {
      toast.error("Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const reprocess = async () => {
    try {
      await reprocessInvoice(documentId);
      setResult(null);
      toast.info("Reprocessing started");
    } catch {
      toast.error("Could not start reprocessing.");
    }
  };

  // ── Still working ────────────────────────────────────────────────────────
  if (!finished && !result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <button
          onClick={() => navigate("/invoices")}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-sky-600" />
            <h1 className="text-lg font-medium text-gray-900">
              {status?.filename ?? "Reading invoice"}
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {status?.stage_label ?? "Starting…"}
            {status?.page_count ? ` · ${status.page_count} page${status.page_count > 1 ? "s" : ""}` : ""}
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width] duration-500"
              style={{ width: `${status?.progress ?? 0}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>{status?.current_stage ?? "UPLOADED"}</span>
            <span className="tabular-nums">{status?.progress ?? 0}%</span>
          </div>

          {status?.used_ocr && (
            <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              This document has no text layer, so it is being read by OCR. That
              takes around two minutes per page.
            </p>
          )}

          {pollError && <p className="mt-4 text-xs text-gray-400">{pollError}</p>}
        </div>
      </div>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (status?.status === "FAILED") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8">
          <div className="flex items-center gap-2 text-red-800">
            <FileWarning className="h-5 w-5" />
            <h1 className="text-lg font-medium">This invoice could not be processed</h1>
          </div>
          <p className="mt-2 text-sm text-red-700">
            {status.error?.message ?? "The extraction failed."}
          </p>
          {status.error?.code && (
            <p className="mt-1 font-mono text-xs text-red-500">{status.error.code}</p>
          )}
          <div className="mt-6 flex gap-2">
            <button
              onClick={reprocess}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => navigate("/invoices")}
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-white"
            >
              Back to invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-sm text-gray-500">
        {loadError ?? <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
    );
  }

  const errors = result.fields.validation_errors ?? [];
  const warnings = result.fields.warnings ?? [];
  const band = confidenceBand(confidence?.document_confidence);

  // ── Review ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/invoices")}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Back to invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-medium text-gray-900">{result.filename}</h1>
            <p className="text-xs text-gray-500">
              {result.document_id}
              {result.page_count ? ` · ${result.page_count} page${result.page_count > 1 ? "s" : ""}` : ""}
              {result.used_ocr ? " · read by OCR" : " · text layer"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {confidence && (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${CONFIDENCE_STYLES[band]}`}
              title="Overall extraction confidence"
            >
              {Math.round(confidence.document_confidence * 100)}% confident
            </span>
          )}
          <button
            onClick={reprocess}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reprocess
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || dirtyFields.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Confirm
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-2">
        <InvoicePageViewer
          documentId={documentId}
          pageCount={result.page_count ?? 1}
          highlights={highlights}
          activePage={activePage}
        />

        <div className="overflow-y-auto pr-1">
          {errors.length > 0 && (
            <section className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-red-800">
                <AlertTriangle className="h-4 w-4" />
                {errors.length === 1 ? "One thing does not add up" : `${errors.length} things do not add up`}
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-red-700">
                {errors.map(message => <li key={message}>· {message}</li>)}
              </ul>
            </section>
          )}

          {warnings.length > 0 && (
            <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-amber-900">
                <Info className="h-4 w-4" /> Worth checking
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-amber-800">
                {warnings.map(message => <li key={message}>· {message}</li>)}
              </ul>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-2.5 text-sm font-medium text-gray-900">
              Invoice details
            </h2>
            <div className="divide-y divide-gray-50">
              {REVIEW_FIELD_ORDER.map(field => {
                const fieldConfidence = confidence?.fields[field];
                const needsAttention = fieldConfidence?.needs_attention ?? false;
                const item = evidence[field];
                const selected = selectedField === field;

                return (
                  <div
                    key={field}
                    onFocus={() => setSelectedField(field)}
                    onMouseEnter={() => item?.box && setSelectedField(field)}
                    className={`px-4 py-2.5 transition-colors ${selected ? "bg-sky-50/60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={`field-${field}`}
                        className="flex items-center gap-1.5 text-xs text-gray-500"
                      >
                        {FIELD_LABELS[field] ?? field}
                        {needsAttention && (
                          <span
                            className="rounded bg-amber-100 px-1 py-px text-[10px] font-medium text-amber-800"
                            title="Low confidence — please check this one"
                          >
                            check
                          </span>
                        )}
                      </label>
                      {fieldConfidence && (
                        <span className="text-[10px] tabular-nums text-gray-400">
                          {Math.round(fieldConfidence.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <input
                      id={`field-${field}`}
                      value={draft[field] ?? ""}
                      onChange={event =>
                        setDraft(current => ({ ...current, [field]: event.target.value }))
                      }
                      inputMode={MONEY_FIELDS.has(field) ? "decimal" : undefined}
                      placeholder={DATE_FIELDS.has(field) ? "YYYY-MM-DD" : "Not found"}
                      className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-200 ${
                        needsAttention ? "border-amber-300 bg-amber-50/40" : "border-gray-200"
                      } ${MONEY_FIELDS.has(field) ? "text-right tabular-nums" : ""}`}
                    />

                    {selected && item?.reasons?.length > 0 && (
                      <p className="mt-1 text-[10px] leading-relaxed text-gray-400">
                        {item.reasons.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {(result.fields.line_items?.length ?? 0) > 0 && (
            <section className="mt-4 rounded-lg border border-gray-200 bg-white">
              <h2 className="border-b border-gray-100 px-4 py-2.5 text-sm font-medium text-gray-900">
                Line items
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  {result.fields.line_items!.length}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-gray-500">
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2 text-left font-medium">Description</th>
                      <th className="px-2 py-2 text-left font-medium">HSN</th>
                      <th className="px-2 py-2 text-right font-medium">Qty</th>
                      <th className="px-2 py-2 text-right font-medium">Rate</th>
                      <th className="px-4 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.fields.line_items!.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-900">{item.description ?? "—"}</td>
                        <td className="px-2 py-2 text-gray-500">{item.hsn_sac ?? "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-gray-700">
                          {item.quantity ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-gray-700">
                          {item.unit_price?.toFixed(2) ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-gray-900">
                          {item.total_amount?.toFixed(2) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {errors.length === 0 && warnings.length === 0 && (
            <p className="mt-4 flex items-center gap-1.5 px-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Everything reconciles. Confirm to post this invoice.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
