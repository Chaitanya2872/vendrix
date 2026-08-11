import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
  BellRing, Building2, CircleAlert, CircleCheck, Clock3, FileSearch, OctagonAlert, ScanLine,
  ShieldCheck, TrendingUp, UserRoundCheck, WalletCards, type LucideIcon,
} from "lucide-react";
import { lookupPlate } from "@/api/documents";
import { money } from "@/pages/Operations/operation-ui";
import {
  operationsApi, type Approval, type AuditLog, type Invoice, type Summary, type Vehicle, type VendorOption,
} from "@/api/operations";

const INVOICE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "#2a78d6",
  PENDING_APPROVAL: "#eb6834",
  APPROVED: "#1baf7a",
  REJECTED: "#eda100",
};
const APPROVAL_STATUS_COLOR: Record<string, string> = {
  PENDING: "#eb6834",
  APPROVED: "#1baf7a",
  REJECTED: "#e34948",
};
const FALLBACK_SERIES_COLOR = "#898781";

function titleCase(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function daysUntil(value?: string): number | null {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function statusCounts<T extends { status: string }>(rows: T[]) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return Array.from(counts, ([status, count]) => ({ status, label: titleCase(status), count }));
}

function ChartCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <article className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-brand-forest">{title}</h2>
          <p className="mb-0 mt-1 text-xs text-brand-muted">{subtitle}</p>
        </div>
        <Icon className="text-brand-gold-dark" size={19} />
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function ChartSkeleton() {
  return <div className="h-48 w-full animate-pulse rounded-lg bg-brand-background" aria-hidden="true" />;
}

function ChartEmpty({ text }: { text: string }) {
  return <div className="grid h-48 place-items-center rounded-lg bg-brand-background/60 text-center text-xs text-brand-muted">{text}</div>;
}

function CountTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as { label: string; count: number; amount?: number };
  return (
    <div className="rounded-md border border-brand-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="m-0 font-semibold text-brand-text">{row.label}</p>
      <p className="m-0 text-brand-muted">
        {row.count} {row.count === 1 ? "record" : "records"}
        {row.amount !== undefined && <> · {money(row.amount)}</>}
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as { label: string; total: number };
  return (
    <div className="rounded-md border border-brand-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="m-0 font-semibold text-brand-text">{row.label}</p>
      <p className="m-0 text-brand-muted">{money(row.total)} invoiced</p>
    </div>
  );
}

export function DashboardPage() {
  const [plate, setPlate] = useState("");
  const [matched, setMatchedState] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [vehiclesError, setVehiclesError] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [invoicesError, setInvoicesError] = useState(false);
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [approvalsError, setApprovalsError] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[] | null>(null);
  const [auditError, setAuditError] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);

  const announce = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3000); };

  useEffect(() => {
    let cancelled = false;
    void operationsApi.summary().then(data => { if (!cancelled) setSummary(data); }).catch(() => { if (!cancelled) setSummaryError(true); });
    void operationsApi.vehicles().then(data => { if (!cancelled) setVehicles(data); }).catch(() => { if (!cancelled) setVehiclesError(true); });
    void operationsApi.invoices().then(data => { if (!cancelled) setInvoices(data); }).catch(() => { if (!cancelled) setInvoicesError(true); });
    void operationsApi.approvals().then(data => { if (!cancelled) setApprovals(data); }).catch(() => { if (!cancelled) setApprovalsError(true); });
    void operationsApi.auditLogs().then(data => { if (!cancelled) setAuditLogs(data); }).catch(() => { if (!cancelled) setAuditError(true); });
    void operationsApi.vendors().then(data => { if (!cancelled) setVendors(data); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const vendorName = (id: string) => vendors.find(v => v.id === id)?.legal_name ?? "Unknown vendor";

  const verifyPlate = async () => {
    try {
      const result = await lookupPlate(plate);
      setMatchedState(Boolean(result.vehicle));
    } catch {
      setMatchedState(false);
    }
  };

  const vehicleCompliance = useMemo(() => {
    if (!vehicles) return null;
    const buckets = { expired: 0, soon: 0, upcoming: 0, compliant: 0 };
    for (const vehicle of vehicles) {
      const days = [daysUntil(vehicle.rc_expiry), daysUntil(vehicle.insurance_expiry)].filter((d): d is number => d !== null);
      const nearest = days.length ? Math.min(...days) : null;
      if (nearest === null || nearest > 90) buckets.compliant += 1;
      else if (nearest < 0) buckets.expired += 1;
      else if (nearest <= 30) buckets.soon += 1;
      else buckets.upcoming += 1;
    }
    return [
      { key: "expired", label: "Expired", count: buckets.expired, color: "#d03b3b", icon: OctagonAlert },
      { key: "soon", label: "Due ≤ 30 days", count: buckets.soon, color: "#ec835a", icon: CircleAlert },
      { key: "upcoming", label: "Due 31–90 days", count: buckets.upcoming, color: "#fab219", icon: Clock3 },
      { key: "compliant", label: "Compliant", count: buckets.compliant, color: "#0ca30c", icon: CircleCheck },
    ];
  }, [vehicles]);

  const attentionVehicles = useMemo(() => {
    if (!vehicles) return null;
    return vehicles
      .map(vehicle => {
        const days = [daysUntil(vehicle.rc_expiry), daysUntil(vehicle.insurance_expiry)].filter((d): d is number => d !== null);
        return { vehicle, nearest: days.length ? Math.min(...days) : null };
      })
      .filter((entry): entry is { vehicle: Vehicle; nearest: number } => entry.nearest !== null && entry.nearest <= 90)
      .sort((a, b) => a.nearest - b.nearest)
      .slice(0, 5);
  }, [vehicles]);

  const invoiceStatusData = useMemo(() => {
    if (!invoices) return null;
    const totals = new Map<string, { count: number; amount: number }>();
    for (const invoice of invoices) {
      const entry = totals.get(invoice.status) ?? { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += invoice.amount + (invoice.tax_amount ?? 0);
      totals.set(invoice.status, entry);
    }
    return Array.from(totals, ([status, values]) => ({ status, label: titleCase(status), ...values }));
  }, [invoices]);

  const invoiceTrend = useMemo(() => {
    if (!invoices) return null;
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const cursor = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: cursor.toLocaleDateString("en-IN", { month: "short" }), total: 0 };
    });
    const byKey = new Map(months.map(entry => [entry.key, entry]));
    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice.invoice_date);
      const bucket = byKey.get(`${invoiceDate.getFullYear()}-${invoiceDate.getMonth()}`);
      if (bucket) bucket.total += invoice.amount + (invoice.tax_amount ?? 0);
    }
    return months;
  }, [invoices]);

  const approvalStatusData = useMemo(() => approvals ? statusCounts(approvals) : null, [approvals]);

  const kpiCards = [
    {
      label: "Awaiting approval", icon: UserRoundCheck, tone: "amber",
      value: summaryError ? "—" : summary ? String(summary.pending_approvals) : null,
      context: summaryError ? "Not available for your role" : "Requests pending review",
    },
    {
      label: "Expiring within 30 days", icon: BellRing, tone: "rose",
      value: vehiclesError ? "—" : vehicleCompliance ? String(vehicleCompliance.find(b => b.key === "soon")?.count ?? 0) : null,
      context: vehiclesError ? "Not available for your role" : "Vehicles due for renewal",
    },
    {
      label: "Vehicles compliant", icon: ShieldCheck, tone: "green",
      value: vehiclesError ? "—" : vehicleCompliance && vehicles ? `${vehicleCompliance.find(b => b.key === "compliant")?.count ?? 0} / ${vehicles.length}` : null,
      context: vehiclesError ? "Not available for your role" : "No expiry due within 90 days",
    },
    {
      label: "Total invoiced value", icon: WalletCards, tone: "blue",
      value: summaryError ? "—" : summary ? money(summary.invoice_total) : null,
      context: summaryError ? "Not available for your role" : "All recorded invoices",
    },
  ];
  const toneClasses: Record<string, string> = { amber: "bg-amber-50 text-amber-800 ring-amber-200", rose: "bg-rose-50 text-rose-800 ring-rose-200", green: "bg-emerald-50 text-emerald-800 ring-emerald-200", blue: "bg-sky-50 text-sky-800 ring-sky-200" };

  return <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
    {notice && <div role="status" className="fixed right-5 top-20 z-50 rounded-lg border border-brand-border bg-brand-forest px-4 py-3 text-sm font-medium text-white shadow-xl">{notice}</div>}
    <header className="flex flex-col gap-4 border-b border-brand-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-dark">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())} · Operations desk</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-forest md:text-3xl">Operations overview</h1>
        <p className="mb-0 mt-1 text-sm text-brand-muted">Your morning control tower for vendor, fleet and payment readiness.</p>
      </div>
      <button onClick={() => announce("Vendor onboarding form opened")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-forest-light focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2"><Building2 size={17} /> Add vendor</button>
    </header>

    <section aria-label="Operational metrics" className="grid gap-px overflow-hidden rounded-xl border border-brand-border bg-brand-border sm:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map(({ label, value, context, icon: Icon, tone }) => (
        <article key={label} className="bg-white p-4">
          <div className="flex items-start justify-between">
            <p className="m-0 text-sm font-semibold text-brand-text">{label}</p>
            <span className={`grid h-8 w-8 place-items-center rounded-md ${toneClasses[tone]}`}><Icon size={16} /></span>
          </div>
          {value !== null ? <p className="mb-1 mt-5 text-2xl font-semibold tracking-tight text-brand-forest">{value}</p> : <div className="mb-1 mt-5 h-8 w-16 animate-pulse rounded bg-brand-background" aria-hidden="true" />}
          <p className="m-0 text-xs text-brand-muted">{context}</p>
        </article>
      ))}
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Invoices by status" subtitle="Count and value of recorded invoices" icon={WalletCards}>
        {invoicesError ? <ChartEmpty text="Not available for your role." /> : invoiceStatusData === null ? <ChartSkeleton /> : invoiceStatusData.length === 0 ? <ChartEmpty text="No invoices recorded yet." /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-brand-border)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={CountTooltip} cursor={{ fill: "var(--color-brand-background)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {invoiceStatusData.map(entry => <Cell key={entry.status} fill={INVOICE_STATUS_COLOR[entry.status] ?? FALLBACK_SERIES_COLOR} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Vehicle compliance" subtitle="RC and insurance expiry across the fleet" icon={ShieldCheck}>
        {vehiclesError ? <ChartEmpty text="Not available for your role." /> : vehicleCompliance === null ? <ChartSkeleton /> : vehicles?.length === 0 ? <ChartEmpty text="No vehicles on file yet." /> : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {vehicleCompliance.map(bucket => (
                <div key={bucket.key} className="flex items-center gap-1.5 rounded-md bg-brand-background px-2 py-1.5 text-xs font-bold" style={{ color: bucket.color }}>
                  <bucket.icon size={13} />{bucket.count}<span className="font-normal text-brand-muted">{bucket.label}</span>
                </div>
              ))}
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleCompliance} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="label" tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={CountTooltip} cursor={{ fill: "var(--color-brand-background)" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {vehicleCompliance.map(entry => <Cell key={entry.key} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </ChartCard>
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
      <ChartCard title="Invoice value trend" subtitle="Total invoiced amount by month, last 6 months" icon={TrendingUp}>
        {invoicesError ? <ChartEmpty text="Not available for your role." /> : invoiceTrend === null ? <ChartSkeleton /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={invoiceTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-brand-border)" }} tickLine={false} />
                <YAxis tickFormatter={value => money(value)} tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={TrendTooltip} />
                <Line type="monotone" dataKey="total" stroke="#234b35" strokeWidth={2} dot={{ r: 4, fill: "#234b35" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="space-y-5">
        <article className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between"><div><h2 className="m-0 text-base font-semibold text-brand-forest">Vehicles needing attention</h2><p className="mb-0 mt-1 text-xs text-brand-muted">RC and insurance due within 90 days</p></div><CircleAlert className="text-brand-gold-dark" size={19} /></div>
          <div className="mt-4 divide-y divide-brand-border">
            {vehiclesError ? <p className="py-3 text-xs text-brand-muted">Not available for your role.</p> : attentionVehicles === null ? <div className="h-24 animate-pulse rounded-lg bg-brand-background" aria-hidden="true" /> : attentionVehicles.length === 0 ? <p className="py-3 text-xs text-brand-muted">Nothing due for renewal within 90 days.</p> : attentionVehicles.map(({ vehicle, nearest }) => (
              <button key={vehicle.id} onClick={() => announce(`Opening ${vehicle.registration_number}`)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: nearest < 0 ? "#d03b3b" : nearest <= 30 ? "#ec835a" : "#fab219" }} />
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-brand-text">{vehicle.registration_number}</span><span className="block truncate text-[11px] text-brand-muted">{vendorName(vehicle.vendor_id)}</span></span>
                <span className="text-[11px] font-bold" style={{ color: nearest < 0 ? "#d03b3b" : "#8e6430" }}>{nearest < 0 ? `Expired ${Math.abs(nearest)}d ago` : `${nearest}d left`}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-brand-border bg-[#fbfaf6] p-5 shadow-sm">
          <div className="flex items-center gap-2"><ScanLine className="text-brand-forest" size={19} /><h2 className="m-0 text-base font-semibold text-brand-forest">Vehicle verification</h2></div>
          <p className="mb-3 mt-1 text-xs leading-5 text-brand-muted">Check a number plate against your internal vehicle records.</p>
          <div className="flex gap-2">
            <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} aria-label="Vehicle plate" className="min-w-0 flex-1 rounded-md border border-brand-border bg-white px-3 py-2 text-sm font-bold uppercase tracking-wide text-brand-text outline-none focus:border-brand-forest" />
            <button onClick={() => void verifyPlate()} aria-label="Check plate" className="rounded-md bg-brand-forest px-3 text-white hover:bg-brand-forest-light"><ScanLine size={17} /></button>
          </div>
          {matched === null ? null : matched ? <div className="mt-3 border-l-2 border-emerald-600 bg-white p-3 text-xs font-bold text-emerald-800">Internal record match found.</div> : <div className="mt-3 border-l-2 border-amber-500 bg-white p-3 text-xs text-brand-muted">No internal vehicle record matches this plate.</div>}
        </article>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Approvals by status" subtitle="Pending items across all approval workflows" icon={CircleCheck}>
        {approvalsError ? <ChartEmpty text="Not available for your role." /> : approvalStatusData === null ? <ChartSkeleton /> : approvalStatusData.length === 0 ? <ChartEmpty text="No approval requests recorded yet." /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--color-brand-border)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-brand-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={CountTooltip} cursor={{ fill: "var(--color-brand-background)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {approvalStatusData.map(entry => <Cell key={entry.status} fill={APPROVAL_STATUS_COLOR[entry.status] ?? FALLBACK_SERIES_COLOR} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <article className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="m-0 text-base font-semibold text-brand-forest">Recent audit activity</h2><p className="mb-0 mt-1 text-xs text-brand-muted">A traceable record of operational change</p></div><FileSearch className="text-brand-gold-dark" size={19} /></div>
        <div className="mt-3 divide-y divide-brand-border">
          {auditError ? <p className="py-3 text-xs text-brand-muted">Audit trail requires administrator access.</p> : auditLogs === null ? <div className="h-24 animate-pulse rounded-lg bg-brand-background" aria-hidden="true" /> : auditLogs.length === 0 ? <p className="py-3 text-xs text-brand-muted">No recent activity recorded.</p> : auditLogs.slice(0, 8).map(log => (
            <div key={log.id} className="flex gap-3 py-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-background text-[10px] font-bold text-brand-forest">{log.resource_type.slice(0, 2).toUpperCase()}</span>
              <p className="m-0 min-w-0 flex-1 text-xs leading-5 text-brand-muted"><span className="font-bold text-brand-text">{titleCase(log.action)}</span><br /><span className="font-medium text-brand-forest">{titleCase(log.resource_type)}</span></p>
              <span className="whitespace-nowrap text-[11px] text-brand-muted">{formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: true })}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  </div>;
}
