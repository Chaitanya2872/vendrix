import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { operationsApi, type Vehicle, type VendorOption } from "@/api/operations";
import { VendorDrawer } from "@/components/vendors/VendorDrawer";
import { VendorSearchSelect } from "@/components/vendors/VendorSearchSelect";
import { FilterBar } from "@/components/common/FilterBar";
import { facetFrom, useFilters } from "@/hooks/useFilters";
import { Badge, Busy, Empty, inputClass, Panel, PageIntro, primaryButtonClass, Problem, SearchField, StatCard, StatGrid, tableHeadClass, date } from "@/pages/Operations/operation-ui";

const DAY = 86_400_000;
const expiring = (value?: string) => Boolean(value && new Date(value).getTime() < Date.now() + 30 * DAY);
const expired = (value?: string) => Boolean(value && new Date(value).getTime() < Date.now());

/** The compliance state of one vehicle, as a single value the filter can
 * select on. Derived rather than stored: it is a statement about today's
 * date, so persisting it would be wrong by tomorrow. Worst of the two
 * documents wins — a vehicle with valid insurance and a lapsed RC is not
 * roadworthy on the strength of the insurance. */
const COMPLIANCE = {
  EXPIRED:  "Expired",
  DUE_SOON: "Expiring in 30 days",
  CURRENT:  "Current",
  UNKNOWN:  "No dates recorded",
} as const;

function compliance(vehicle: Vehicle): string {
  if (expired(vehicle.rc_expiry) || expired(vehicle.insurance_expiry)) return COMPLIANCE.EXPIRED;
  if (expiring(vehicle.rc_expiry) || expiring(vehicle.insurance_expiry)) return COMPLIANCE.DUE_SOON;
  if (!vehicle.rc_expiry && !vehicle.insurance_expiry) return COMPLIANCE.UNKNOWN;
  return COMPLIANCE.CURRENT;
}

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // `load` deliberately sets no state before its first await: it runs from an
  // effect, and a synchronous setState there costs a second render pass on
  // every mount. `loading` already starts true, so the first load needs no
  // announcement — only the manual refresh after an add does.
  const load = useCallback(async () => {
    try {
      const [items, vendorItems] = await Promise.all([operationsApi.vehicles(), operationsApi.vendors()]);
      setVehicles(items);
      setVendors(vendorItems);
    } catch {
      setError("Vehicles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = async () => { setLoading(true); await load(); };

  // Wrapped rather than `void load()`: every state update inside `load`
  // happens after an await, but the lint rule only sees that through an
  // async boundary written here.
  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  const vendorName = useCallback(
    (id: string) => vendors.find(item => item.id === id)?.legal_name ?? "Unknown vendor",
    [vendors],
  );

  const filters = useFilters({
    facets: [
      // Vendors are labelled by name but selected by id: two vendors may
      // share a legal name, and the id is what the row actually carries.
      { key: "vendor", label: "Vendor", options: facetFrom(vehicles, v => v.vendor_id, vendorName) },
      { key: "type", label: "Type", options: facetFrom(vehicles, v => v.vehicle_type) },
      { key: "status", label: "Status", options: facetFrom(vehicles, v => v.status, s => s.replaceAll("_", " ")) },
      { key: "compliance", label: "Compliance", options: facetFrom(vehicles, compliance) },
    ],
    dates: [{ key: "registered", label: "Registered" }],
  });

  const { matches } = filters;
  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return vehicles.filter(item => {
      if (!matches({
        vendor: item.vendor_id,
        type: item.vehicle_type,
        status: item.status,
        compliance: compliance(item),
        registered: item.created_at,
      })) return false;
      if (!search) return true;
      // Vendor name is searchable even though it lives on another record —
      // "show me Acme's trucks" is the question people actually type.
      return `${item.registration_number} ${item.make ?? ""} ${item.model ?? ""} ${item.vehicle_type} ${vendorName(item.vendor_id)}`
        .toLowerCase().includes(search);
    });
  }, [vehicles, query, matches, vendorName]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await operationsApi.createVehicle({
        vendor_id: String(data.get("vendor_id")),
        registration_number: String(data.get("registration_number")),
        vehicle_type: String(data.get("vehicle_type")),
        make: String(data.get("make")) || undefined,
        model: String(data.get("model")) || undefined,
        rc_expiry: String(data.get("rc_expiry")) || undefined,
        insurance_expiry: String(data.get("insurance_expiry")) || undefined,
        status: "ACTIVE",
      });
      setOpen(false);
      await refresh();
    } catch {
      setError("Vehicle could not be saved. Registration numbers must be unique.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <main className="space-y-5">
      <PageIntro eyebrow="Fleet control" title="Vehicles">
        <button onClick={() => setOpen(true)} className={primaryButtonClass}><Plus className="h-4 w-4" />Add vehicle</button>
      </PageIntro>

      <StatGrid>
        <StatCard label="Registered fleet" value={vehicles.length} />
        <StatCard label="Active" value={vehicles.filter(item => item.status === "ACTIVE").length} />
        <StatCard label="Attention due" value={vehicles.filter(item => expiring(item.rc_expiry) || expiring(item.insurance_expiry)).length} />
      </StatGrid>

      <Panel>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <p className="m-0 self-center text-sm font-semibold text-brand-forest">Fleet register</p>
            <div className="sm:min-w-75">
              <SearchField value={query} onChange={setQuery} placeholder="Search registration, make or vendor" />
            </div>
          </div>
          <FilterBar filters={filters} />
        </div>

        {loading ? <Busy />
          : error && !vehicles.length ? <Problem message={error} />
          : !rows.length ? (
            <Empty
              title={vehicles.length ? "No vehicles match these filters" : "No vehicles found"}
              detail={vehicles.length ? "Clear a filter or widen the date range to see more of the fleet." : "Register a vehicle to begin tracking compliance."}
            />
          ) : <>
            {/* Cards below sm, where a five-column table cannot be read. */}
            <div className="divide-y divide-brand-border sm:hidden">
              {rows.map(item => (
                <article className="p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 font-semibold text-brand-forest">{item.registration_number}</p>
                      <p className="mb-0 mt-1 text-xs text-brand-muted">{[item.make, item.model, item.vehicle_type].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                  <p className="mb-0 mt-3 text-sm">{vendorName(item.vendor_id)}</p>
                  <p className="mb-0 mt-1 text-xs text-brand-muted">RC {date(item.rc_expiry)} · Insurance {date(item.insurance_expiry)}</p>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-200 text-left text-sm">
                <thead className={tableHeadClass}>
                  <tr><th className="px-5 py-3">Vehicle</th><th>Vendor</th><th>RC expiry</th><th>Insurance expiry</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.map(item => (
                    <tr key={item.id} className="border-t border-brand-border">
                      <td className="px-5 py-4">
                        <b>{item.registration_number}</b>
                        <p className="mb-0 mt-1 text-xs text-brand-muted">{[item.make, item.model, item.vehicle_type].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td>{vendorName(item.vendor_id)}</td>
                      <td>{date(item.rc_expiry)}</td>
                      <td>{date(item.insurance_expiry)}</td>
                      <td><Badge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="border-t border-brand-border px-5 py-3 text-xs text-brand-muted">
              Showing {rows.length} of {vehicles.length} vehicles
            </footer>
          </>}
      </Panel>
    </main>

    <VendorDrawer open={open} onClose={() => setOpen(false)} title="Register vehicle" subtitle="Attach it to an existing vendor profile">
      <form onSubmit={add} className="space-y-5">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Field label="Vendor"><VendorSearchSelect vendors={vendors} name="vendor_id" required /></Field>
        <Field label="Registration number"><input required name="registration_number" placeholder="MH 01 AB 1234" className={inputClass} /></Field>
        <Field label="Vehicle type"><input required name="vehicle_type" placeholder="Truck, van, car…" className={inputClass} /></Field>
        <Field label="Make"><input name="make" className={inputClass} /></Field>
        <Field label="Model"><input name="model" className={inputClass} /></Field>
        <Field label="RC expiry"><input name="rc_expiry" type="date" className={inputClass} /></Field>
        <Field label="Insurance expiry"><input name="insurance_expiry" type="date" className={inputClass} /></Field>
        <button disabled={saving} className={`w-full ${primaryButtonClass}`}><ShieldCheck className="h-4 w-4" />{saving ? "Saving…" : "Save vehicle"}</button>
      </form>
    </VendorDrawer>
  </>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-brand-text"><span>{label}</span>{children}</label>;
}
